import { cartesianProduct, countingSequence, factorial, product, setEquals, sum, triangular } from "./algorithm";
import debug from "./debug";
import Puzzle from "./puzzle";

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
      replacements += this.useUniqueness();
    }
    if (replacements === 0) {
      replacements += this.useRequiredness();
    }
    if (replacements === 0) {
      replacements += this.useUniqueness2();
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

  useUniqueness2() {
    let replacements = 0;
    if (this.uniqueValues) {
      // if the same two numbers are the only options for two cells, they can't be in any other cell
      // TODO check for triads, quadruples, etc.

      // find the cells that have only two options
      let cellsWithTwoOptions: { i: number, j: number, options: Set<number> }[] = [];
      for (let i = 0; i < this.size; i++) {
        for (let j = 0; j < this.size; j++) {
          if (this.valueOptions[i][j].size === 2) {
            cellsWithTwoOptions.push({ i, j, options: this.valueOptions[i][j] });
          }
        }
      }

      // see if any of the pairs of those cells have the same two options
      if (cellsWithTwoOptions.length > 1) {
        for (let i = 0; i < cellsWithTwoOptions.length - 1; i++) {
          const cell1 = cellsWithTwoOptions[i];
          for (let j = i + 1; j < cellsWithTwoOptions.length; j++) {
            const cell2 = cellsWithTwoOptions[j];
            // if these cells have the same two options, they cannot be in any other cell
            if (setEquals(cell1.options, cell2.options)) {
              const [v1, v2] = Array.from(cell1.options);
              for (let row = 0; row < this.size; row++) {
                for (let col = 0; col < this.size; col++) {
                  // if a cell has either value and is not one of the two identified cells, remove the value
                  if (!((row === cell1.i && col === cell1.j) || (row === cell2.i && col === cell2.j))) {
                    if (this.valueOptions[row][col].has(v1)) {
                      this.valueOptions[row][col].delete(v1);
                      replacements++;
                    }
                    if (this.valueOptions[row][col].has(v2)) {
                      this.valueOptions[row][col].delete(v2);
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

  useRequiredness() {
    let replacements = 0;
    // if a number can only be in this cell and it must be somewhere in the puzzle,
    // it is the only option for this cell
    // TODO extend to diads, triads, quadruples, etc.
    if (this.uniqueValues && this.maxValue === this.size * this.size) {
      for (let n = 1; n <= this.maxValue; n++) {
        let cellsForN: [number, number][] = [];
        for (let row = 0; row < this.size; row++) {
          for (let col = 0; col < this.size; col++) {
            if (this.valueOptions[row][col].has(n)) {
              cellsForN.push([row, col]);
            }
          }
        }
        if (cellsForN.length === 1 && this.valueOptions[cellsForN[0][0]][cellsForN[0][1]].size > 1) {
          this.valueOptions[cellsForN[0][0]][cellsForN[0][1]] = new Set([n]);
          replacements++;
        }
      }
    }
    return replacements;
  }
}