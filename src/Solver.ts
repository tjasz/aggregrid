import { combinations, countingSequence, factorial, product, sum, triangular } from "./algorithm";
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
    this.valueOptions = [];
    for (let i = 0; i < this.size; i++) {
      this.valueOptions.push([]);
      for (let j = 0; j < this.size; j++) {
        this.valueOptions[i].push(new Set(countingSequence(this.maxValue).filter(v =>
          (this.rowProducts[i] === undefined || this.rowProducts[i]! % v === 0) &&
          (this.colProducts[j] === undefined || this.colProducts[j]! % v === 0) &&
          (this.rowSums[i] === undefined || (
            this.rowSums[i]! - (this.uniqueValues ? triangular(this.size - 1) : (this.size - 1)) - v >= 0 &&
            this.rowSums[i]! - (this.uniqueValues ? triangular(this.maxValue) - triangular(this.maxValue - (this.size - 1)) : (this.size - 1) * this.maxValue) - v <= 0
          )) &&
          (this.colSums[i] === undefined || (
            this.colSums[i]! - (this.uniqueValues ? triangular(this.size - 1) : (this.size - 1)) - v >= 0 &&
            this.colSums[i]! - (this.uniqueValues ? triangular(this.maxValue) - triangular(this.maxValue - (this.size - 1)) : (this.size - 1) * this.maxValue) - v <= 0
          ))
        )));
      }
    }
  }

  solve() {
    for (let i = 0; i < 10 && this.valueOptions.some(rowOptions => rowOptions.some(cellOptions => cellOptions.size > 1)); i++) {
      this.solveStep();
    }
    const solved = !this.valueOptions.some(rowOptions => rowOptions.some(cellOptions => cellOptions.size > 1));
    return solved;
  }

  solveStep() {
    this.useRowClues();
    this.useColClues();

    // TODO even if more than one row/col product/sum is unknown, the aggregate for all the un-hinted cells is known

    this.useUniqueness();
    this.useRequiredness();
  }

  useRowClues() {
    // use the row products and sums to eliminate options
    for (let row = 0; row < this.size; row++) {
      if (this.rowProducts[row] !== undefined || this.rowSums[row] !== undefined) {
        const combs = combinations(this.valueOptions[row].map((s, j) => Array.from(s))).filter(g =>
          (this.rowProducts[row] === undefined || product(g) === this.rowProducts[row]) &&
          (this.rowSums[row] === undefined || sum(g) === this.rowSums[row]) &&
          (!this.uniqueValues || new Set(g).size === g.length)
        )
        for (let col = 0; col < this.size; col++) {
          this.valueOptions[row][col] = new Set(combs.map(g => g[col]))
        }
      }
    }
  }

  useColClues() {
    // use the col products and sums to eliminate options
    for (let col = 0; col < this.size; col++) {
      if (this.colProducts[col] !== undefined || this.colSums[col] !== undefined) {
        const colValueOptions = this.valueOptions.map((options, row) => Array.from(options[col]));
        const combs = combinations(colValueOptions).filter(g =>
          (this.colProducts[col] === undefined || product(g) === this.colProducts[col]) &&
          (this.colSums[col] === undefined || sum(g) === this.colSums[col]) &&
          (!this.uniqueValues || new Set(g).size === g.length)
        )
        for (let row = 0; row < this.size; row++) {
          this.valueOptions[row][col] = new Set(combs.map(g => g[row]))
        }
      }
    }
  }

  useUniqueness() {
    // if a number is the only option for this cell, it can't be in any other cell
    // TODO extend to diads, triads, quadruples, etc.
    if (this.uniqueValues) {
      for (let row = 0; row < this.size; row++) {
        for (let col = 0; col < this.size; col++) {
          if (this.valueOptions[row][col].size === 1) {
            for (let i = 0; i < this.size; i++) {
              for (let j = 0; j < this.size; j++) {
                if (i !== row || j !== col) {
                  this.valueOptions[i][j].delete(Array.from(this.valueOptions[row][col])[0]);
                }
              }
            }
          }
        }
      }
    }
  }

  useRequiredness() {
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
        if (cellsForN.length === 1) {
          this.valueOptions[cellsForN[0][0]][cellsForN[0][1]] = new Set([n]);
        }
      }
    }
  }
}