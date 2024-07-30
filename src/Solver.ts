import { combinations, countingSequence } from "./algorithm";
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

  valueOptions: Set<number>[][];

  constructor(puzzle: Puzzle) {
    this.size = puzzle.size;
    this.maxValue = puzzle.maxValue;
    this.uniqueValues = puzzle.uniqueValues;

    this.rowSums = puzzle.rowSums;
    this.rowProducts = puzzle.rowProducts;
    this.colSums = puzzle.colSums;
    this.colProducts = puzzle.colProducts;

    // start out by setting the allowed values for each cell to the entire puzzle set
    this.valueOptions = [];
    for (let i = 0; i < this.size; i++) {
      this.valueOptions.push([]);
      for (let j = 0; j < this.size; j++) {
        this.valueOptions[i].push(new Set(countingSequence(this.maxValue)));
      }
    }
  }

  solve() {
    for (let i = 0; i < 10 && this.valueOptions.some(rowOptions => rowOptions.some(cellOptions => cellOptions.size > 1)); i++) {
      this.solveStep();
    }
    return !this.valueOptions.some(rowOptions => rowOptions.some(cellOptions => cellOptions.size > 1));
  }

  solveStep() {
    // use the row products and sums to eliminate options
    for (let row = 0; row < this.size; row++) {
      if (this.rowProducts[row] !== undefined || this.rowSums[row] !== undefined) {
        const combs = combinations(this.valueOptions[row].map((s, j) => Array.from(s))).filter(g =>
          (this.rowProducts[row] === undefined || g.reduce((agg, c) => c * agg, 1) === this.rowProducts[row]) &&
          (this.rowSums[row] === undefined || g.reduce((agg, c) => c + agg, 0) === this.rowSums[row]) &&
          (!this.uniqueValues || new Set(g).size === g.length)
        )
        for (let col = 0; col < this.size; col++) {
          this.valueOptions[row][col] = new Set(combs.map(g => g[col]))
        }
      }
    }
    // use the col products and sums to eliminate options
    for (let col = 0; col < this.size; col++) {
      if (this.colProducts[col] !== undefined || this.colSums[col] !== undefined) {
        const colValueOptions = this.valueOptions.map((options, row) => Array.from(options[col]));
        const combs = combinations(colValueOptions).filter(g =>
          (this.colProducts[col] === undefined || g.reduce((agg, c) => c * agg, 1) === this.colProducts[col]) &&
          (this.colSums[col] === undefined || g.reduce((agg, c) => c + agg, 0) === this.colSums[col]) &&
          (!this.uniqueValues || new Set(g).size === g.length)
        )
        for (let row = 0; row < this.size; row++) {
          this.valueOptions[row][col] = new Set(combs.map(g => g[row]))
        }
      }
    }
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
    // if a number can only be in this cell, it is the only option for this cell
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