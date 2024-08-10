import { cartesianProduct, combinations, countingSequence, factorial, product, setEquals, sum, triangular } from "./algorithm";
import debug from "./debug";
import Puzzle from "./puzzle";
import GeneralSet from "./GeneralSet";

export class Solver {
  size: number;
  maxValue: number;
  uniqueValues: boolean;

  // aggregate hints
  rowSums: (number | undefined)[];
  colSums: (number | undefined)[];
  rowProducts: (number | undefined)[];
  colProducts: (number | undefined)[];
  totalSum: number | undefined;
  totalProduct: number | undefined;

  valueOptions: Set<number>[][];

  constructor(puzzle: Puzzle) {
    this.size = puzzle.size;
    this.maxValue = puzzle.maxValue;
    this.uniqueValues = puzzle.uniqueValues;

    this.rowSums = puzzle.rowSums.slice();
    this.rowProducts = puzzle.rowProducts.slice();
    this.colSums = puzzle.colSums.slice();
    this.colProducts = puzzle.colProducts.slice();

    // if the total sum or total product can be known, set them
    this.totalSum = (this.uniqueValues && this.maxValue === this.size * this.size)
      ? triangular(this.maxValue)
      : this.rowSums.every(n => n !== undefined)
        ? sum(this.rowSums as number[])
        : this.colSums.every(n => n !== undefined)
          ? sum(this.colSums as number[])
          : undefined;
    this.totalProduct = (this.uniqueValues && this.maxValue === this.size * this.size)
      ? factorial(this.maxValue)
      : this.rowProducts.every(n => n !== undefined)
        ? product(this.rowProducts as number[])
        : this.colProducts.every(n => n !== undefined)
          ? product(this.colProducts as number[])
          : undefined;

    // infer additional aggregate hints
    if (this.totalSum) {
      const undefinedRowSumsWithIndex = this.rowSums.map((v, i) => ({ v, i })).filter(v => v.v === undefined);
      if (undefinedRowSumsWithIndex.length === 1) {
        const remainingSum = this.totalSum - sum(this.rowSums.filter(v => v !== undefined) as number[]);
        this.rowSums[undefinedRowSumsWithIndex[0].i] = remainingSum;
      }

      const undefinedColSumsWithIndex = this.colSums.map((v, i) => ({ v, i })).filter(v => v.v === undefined);
      if (undefinedColSumsWithIndex.length === 1) {
        const remainingSum = this.totalSum - sum(this.colSums.filter(v => v !== undefined) as number[]);
        this.colSums[undefinedColSumsWithIndex[0].i] = remainingSum;
      }
    }
    if (this.totalProduct) {
      const undefinedRowProductsWithIndex = this.rowProducts.map((v, i) => ({ v, i })).filter(v => v.v === undefined);
      if (undefinedRowProductsWithIndex.length === 1) {
        const remainingProduct = this.totalProduct / product(this.rowProducts.filter(v => v !== undefined) as number[]);
        this.rowProducts[undefinedRowProductsWithIndex[0].i] = remainingProduct;
      }

      const undefinedColProductsWithIndex = this.colProducts.map((v, i) => ({ v, i })).filter(v => v.v === undefined);
      if (undefinedColProductsWithIndex.length === 1) {
        const remainingProduct = this.totalProduct / product(this.colProducts.filter(v => v !== undefined) as number[]);
        this.colProducts[undefinedColProductsWithIndex[0].i] = remainingProduct;
      }
    }

    // start out by setting the allowed values for each cell to the entire set of factors of its known product clues
    // that can also fit within the bounds of the known sum clues
    // further reduction will be done later based on options of other cells
    const minRemainingSum = this.uniqueValues ? triangular(this.size - 1) : (this.size - 1);
    const maxRemainingSum = this.uniqueValues ? triangular(this.maxValue) - triangular(this.maxValue - (this.size - 1)) : (this.size - 1) * this.maxValue;
    this.valueOptions = [];
    for (let i = 0; i < this.size; i++) {
      this.valueOptions.push([]);
      for (let j = 0; j < this.size; j++) {
        this.valueOptions[i].push(new Set(countingSequence(this.maxValue).filter(v => {
          if (this.rowProducts[i] !== undefined) {
            if (this.rowProducts[i]! % v !== 0) {
              debug(`Rejecting value ${v} in cell [${i},${j}] - is not a factor of row product ${this.rowProducts[i]}.`);
              return false;
            }
          }
          if (this.colProducts[j] !== undefined) {
            if (this.colProducts[j]! % v !== 0) {
              debug(`Rejecting value ${v} in cell [${i},${j}] - is not a factor of column product ${this.colProducts[j]}.`);
              return false;
            }
          }
          if (this.rowSums[i] !== undefined) {
            if (v < this.rowSums[i]! - maxRemainingSum) {
              debug(`Rejecting value ${v} in cell [${i},${j}] - is too small to be part of row sum ${this.rowSums[i]}.`);
              return false;
            }
            if (v > this.rowSums[i]! - minRemainingSum) {
              debug(`Rejecting value ${v} in cell [${i},${j}] - is too large to be part of row sum ${this.rowSums[i]}.`);
              return false;
            }
          }
          if (this.colSums[j] !== undefined) {
            if (v < this.colSums[j]! - maxRemainingSum) {
              debug(`Rejecting value ${v} in cell [${i},${j}] - is too small to be part of column sum ${this.colSums[j]}.`);
              return false;
            }
            if (v > this.colSums[j]! - minRemainingSum) {
              debug(`Rejecting value ${v} in cell [${i},${j}] - is too large to be part of column sum ${this.colSums[j]}.`);
              return false;
            }
          }
          return true;
        }
        )));
      }
    }
  }

  solve() {
    // try for a while with the simple strategies
    for (
      let i = 0, replacements = 1;
      i < 10 && replacements > 0 && this.valueOptions.some(rowOptions => rowOptions.some(cellOptions => cellOptions.size > 1));
      i++, replacements = this.solveStep()
    );

    const solved = !this.valueOptions.some(rowOptions => rowOptions.some(cellOptions => cellOptions.size > 1));
    if (this.valueOptions.some(rowOptions => rowOptions.some(cellOptions => cellOptions.size < 1))) {
      console.error(this);
      throw new Error("Puzzle had contradictory clues!")
    }
    return solved;
  }

  solveStep() {
    let replacements = this.useRowClues();
    if (replacements === 0) {
      replacements += this.useColClues();
    }
    if (replacements === 0) {
      replacements += this.useRequiredness(1);
    }
    if (replacements === 0) {
      replacements += this.useUniqueness();
    }
    for (let x = 2; replacements === 0 && x <= Math.ceil(this.size * this.size / 2); x++) {
      replacements += this.useRequiredness(x);
    }
    for (let x = 2; replacements === 0 && x <= Math.ceil(this.size * this.size / 2); x++) {
      replacements += this.useUniqueness2(x);
    }
    return replacements;
  }

  useRowClues() {
    // use the row products and sums to eliminate options
    let replacements = 0;
    for (let row = 0; row < this.size; row++) {
      if (this.rowProducts[row] !== undefined || this.rowSums[row] !== undefined) {
        const rowValueOptions = this.valueOptions[row].map((s, j) => Array.from(s));
        const combs = cartesianProduct(rowValueOptions).filter(g =>
          (this.rowProducts[row] === undefined || product(g) === this.rowProducts[row]) &&
          (this.rowSums[row] === undefined || sum(g) === this.rowSums[row]) &&
          (!this.uniqueValues || new Set(g).size === g.length)
        )
        for (let col = 0; col < this.size; col++) {
          const newOptions = new Set(combs.map(g => g[col]));
          if (newOptions.size !== this.valueOptions[row][col].size) {
            this.valueOptions[row][col] = newOptions;
            replacements++;
          }
        }
      }
    }
    return replacements;
  }

  useColClues() {
    // use the col products and sums to eliminate options
    let replacements = 0;
    for (let col = 0; col < this.size; col++) {
      if (this.colProducts[col] !== undefined || this.colSums[col] !== undefined) {
        const colValueOptions = this.valueOptions.map((options, row) => Array.from(options[col]));
        const combs = cartesianProduct(colValueOptions).filter(g =>
          (this.colProducts[col] === undefined || product(g) === this.colProducts[col]) &&
          (this.colSums[col] === undefined || sum(g) === this.colSums[col]) &&
          (!this.uniqueValues || new Set(g).size === g.length)
        )
        for (let row = 0; row < this.size; row++) {
          const newOptions = new Set(combs.map(g => g[row]));
          if (newOptions.size !== this.valueOptions[row][col].size) {
            this.valueOptions[row][col] = newOptions;
            replacements++;
          }
        }
      }
    }
    return replacements;
  }

  useTotalProduct() {
    let replacements = 0;
    if (this.totalProduct) {
      const unknownRowProducts = this.rowProducts.map((product, i) => ({ product, i })).filter(p => p.product === undefined);
      if (unknownRowProducts.length > 1) {
        const remainingProduct = this.totalProduct / this.rowProducts.reduce<number>((agg, c) => agg * (c ?? 1), 1);
        const valueOptions: number[][] = [];
        for (const unknownRow of unknownRowProducts) {
          for (let col = 0; col < this.size; col++) {
            valueOptions.push(Array.from(this.valueOptions[unknownRow.i][col]));
          }
        }
        const combs = cartesianProduct(valueOptions).filter(g =>
          product(g) === remainingProduct &&
          (!this.uniqueValues || new Set(g).size === g.length)
        );
        for (let i = 0; i < unknownRowProducts.length; i++) {
          const unknownRow = unknownRowProducts[i];
          for (let col = 0; col < this.size; col++) {
            const newOptions = new Set(combs.map(g => g[i * this.size + col]));
            if (newOptions.size !== this.valueOptions[unknownRow.i][col].size) {
              this.valueOptions[unknownRow.i][col] = newOptions;
              replacements++;
            }
          }
        }
      }

      const unknownColProducts = this.colProducts.map((product, i) => ({ product, i })).filter(p => p.product === undefined);
      if (unknownColProducts.length > 1) {
        const remainingProduct = this.totalProduct / this.colProducts.reduce<number>((agg, c) => agg * (c ?? 1), 1);
        const valueOptions: number[][] = [];
        for (let row = 0; row < this.size; row++) {
          for (const unknownCol of unknownColProducts) {
            valueOptions.push(Array.from(this.valueOptions[row][unknownCol.i]));
          }
        }
        const combs = cartesianProduct(valueOptions).filter(g =>
          product(g) === remainingProduct &&
          (!this.uniqueValues || new Set(g).size === g.length)
        );
        for (let row = 0; row < this.size; row++) {
          for (let i = 0; i < unknownColProducts.length; i++) {
            const unknownCol = unknownColProducts[i];
            const newOptions = new Set(combs.map(g => g[row * unknownColProducts.length + i]));
            if (newOptions.size !== this.valueOptions[row][unknownCol.i].size) {
              this.valueOptions[row][unknownCol.i] = newOptions;
              replacements++;
            }
          }
        }
      }
    }
    return replacements;
  }

  useUniqueness() {
    let replacements = 0;
    if (this.uniqueValues) {
      for (let row = 0; row < this.size; row++) {
        for (let col = 0; col < this.size; col++) {
          if (this.valueOptions[row][col].size === 1) {
            const value = Array.from(this.valueOptions[row][col])[0];
            for (let i = 0; i < this.size; i++) {
              for (let j = 0; j < this.size; j++) {
                if (i !== row || j !== col && this.valueOptions[i][j].has(value)) {
                  this.valueOptions[i][j].delete(value);
                  replacements++;
                }
              }
            }
          }
        }
      }
    }
    return replacements;
  }

  useUniqueness2(x: number) {
    let replacements = 0;
    if (this.uniqueValues) {
      // if the same X numbers are the only options for X cells, they can't be in any other cell

      // find the cells that have only X options
      let cellsWithXOptions: { i: number, j: number, options: Set<number> }[] = [];
      for (let i = 0; i < this.size; i++) {
        for (let j = 0; j < this.size; j++) {
          if (this.valueOptions[i][j].size > 1 && this.valueOptions[i][j].size <= x) {
            cellsWithXOptions.push({ i, j, options: this.valueOptions[i][j] });
          }
        }
      }

      // see if any of the groups of X cells have the same X options
      if (cellsWithXOptions.length >= x) {
        for (const group of combinations(cellsWithXOptions, x)) {
          const groupOptions = new Set(group.map(cell => Array.from(cell.options)).flat());
          if (groupOptions.size < x) {
            throw new Error(`${x} cells have fewer than ${x} options between them.`)
          }
          // if these cells have the same X options, they cannot be in any other cell
          if (groupOptions.size === x) {

            for (let row = 0; row < this.size; row++) {
              for (let col = 0; col < this.size; col++) {
                // if a cell has one of these group options and is not part of the group, remove the options
                if (!group.some(cell => row === cell.i && col === cell.j)) {
                  for (const v of groupOptions) {
                    if (this.valueOptions[row][col].has(v)) {
                      this.valueOptions[row][col].delete(v);
                      replacements++;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    return replacements;
  }

  useRequiredness(x: number) {
    let replacements = 0;
    if (this.uniqueValues && this.maxValue === this.size * this.size) {
      let cellsForN: [number, number][][] = [];
      for (let n = 1; n <= this.maxValue; n++) {
        cellsForN.push([]);
        for (let row = 0; row < this.size; row++) {
          for (let col = 0; col < this.size; col++) {
            if (this.valueOptions[row][col].has(n)) {
              cellsForN[n - 1].push([row, col]);
            }
          }
        }
      }
      // if a set of X numbers can only be in X cells, they have to be in those cells
      for (const group of combinations(countingSequence(this.maxValue), x)) {
        const cellsForSet = new GeneralSet<[number, number]>()
        for (const v of group) {
          for (const cell of cellsForN[v - 1])
            cellsForSet.add(cell);
        }
        if (cellsForSet.size() === x) {
          for (const cell of cellsForSet) {
            const newOptions = new Set(group.filter(v => this.valueOptions[cell[0]][cell[1]].has(v)));
            if (this.valueOptions[cell[0]][cell[1]].size !== newOptions.size) {
              this.valueOptions[cell[0]][cell[1]] = newOptions;
              replacements++;
            }
          }
        }
      }
    }
    return replacements;
  }
}