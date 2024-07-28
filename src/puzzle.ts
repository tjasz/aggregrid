import { combinations, countingSequence, factorizations, intersect, triangular } from "./algorithm";
import Grid from "./grid";

export default class Puzzle {
  // basic properties of the grid
  grid: Grid;
  size: number;
  maxValue: number;
  uniqueValues: boolean;

  // aggregate hints
  rowSums: (number | undefined)[];
  colSums: (number | undefined)[];
  rowProducts: (number | undefined)[];
  colProducts: (number | undefined)[];

  constructor(size?: number, maxValue?: number, uniqueValues?: boolean) {
    this.grid = new Grid(size, maxValue, uniqueValues);

    this.size = this.grid.size;
    this.maxValue = this.grid.maxValue;
    this.uniqueValues = this.grid.uniqueValues;

    this.rowSums = this.grid.rowSums.slice();
    this.rowProducts = this.grid.rowProducts.slice();
    this.colSums = this.grid.colSums.slice();
    this.colProducts = this.grid.colProducts.slice();

    // remove hints until the puzzle is unsolvable
    let removedHint = this.harden();
    while (new Solver(this).solve()) {
      removedHint = this.harden();
    }
    // restore the last removed hint, making it barely solvable
    switch (removedHint) {
      case 0:
      case 1:
      case 2:
        this.rowSums[removedHint] = this.grid.rowSums[removedHint];
        break;
      case 3:
      case 4:
      case 5:
        this.rowProducts[removedHint - 3] = this.grid.rowProducts[removedHint - 3];
        break;
      case 6:
      case 7:
      case 8:
        this.colSums[removedHint - 6] = this.grid.colSums[removedHint - 6];
        break;
      case 9:
      case 10:
      case 11:
        this.colProducts[removedHint - 9] = this.grid.colProducts[removedHint - 9];
        break;
    }
  }

  harden() {
    // TODO instead of hardening at random, harden as much as possible
    const choice = Math.floor(Math.random() * 12);
    switch (choice) {
      case 0:
      case 1:
      case 2:
        this.rowSums[choice] = undefined;
        break;
      case 3:
      case 4:
      case 5:
        this.rowProducts[choice - 3] = undefined;
        break;
      case 6:
      case 7:
      case 8:
        this.colSums[choice - 6] = undefined;
        break;
      case 9:
      case 10:
      case 11:
        this.colProducts[choice - 9] = undefined;
        break;
    }
    return choice;
  }

  validate(solution: number[][]) {
    // validate size
    if (solution.length !== this.size) {
      return false;
    }
    for (let i = 0; i < solution.length; i++) {
      if (solution[i].length !== this.size) {
        return false;
      }
    }

    // validate max value
    const flattened = solution.flat();
    if (!flattened.every(n => n >= 1 && n <= this.maxValue)) {
      return false;
    }

    // validate uniqueness
    if (this.uniqueValues && flattened.length !== new Set(flattened).size) {
      return false;
    }

    // validate aggregate clues
    let rowSums = new Array(this.size).fill(0);
    let colSums = new Array(this.size).fill(0);
    let rowProducts = new Array(this.size).fill(1);
    let colProducts = new Array(this.size).fill(1);
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        const value = solution[row][col]
        rowSums[row] += value;
        colSums[col] += value;
        rowProducts[row] *= value;
        colProducts[col] *= value;
      }
    }
    for (let i = 0; i < this.size; i++) {
      if (this.rowSums[i] !== rowSums[i] ||
        this.rowProducts[i] !== rowProducts[i] ||
        this.colSums[i] !== colSums[i] ||
        this.colProducts !== colProducts[i]
      ) {
        return false;
      }
    }

    return true;
  }
}

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
    // use the row products to eliminate options
    for (let row = 0; row < this.size; row++) {
      if (this.rowProducts[row] !== undefined) {
        const combs = combinations(this.valueOptions[row].map((s, j) => Array.from(s))).filter(g =>
          g.reduce((agg, c) => c * agg, 1) === this.rowProducts[row] &&
          (!this.uniqueValues || new Set(g).size === g.length)
        )
        for (let col = 0; col < this.size; col++) {
          this.valueOptions[row][col] = new Set(combs.map(g => g[col]))
        }
      }
    }
    // use the col products to eliminate options
    for (let col = 0; col < this.size; col++) {
      if (this.colProducts[col] !== undefined) {
        const colValueOptions = this.valueOptions.map((options, row) => Array.from(options[col]));
        const combs = combinations(colValueOptions).filter(g =>
          g.reduce((agg, c) => c * agg, 1) === this.colProducts[col] &&
          (!this.uniqueValues || new Set(g).size === g.length)
        )
        for (let row = 0; row < this.size; row++) {
          this.valueOptions[row][col] = new Set(combs.map(g => g[row]))
        }
      }
    }
    // use the row sums to eliminate options
    for (let row = 0; row < this.size; row++) {
      if (this.rowSums[row] !== undefined) {
        const combs = combinations(this.valueOptions[row].map((s, j) => Array.from(s))).filter(g =>
          g.reduce((agg, c) => c + agg, 0) === this.rowSums[row] &&
          (!this.uniqueValues || new Set(g).size === g.length)
        )
        for (let col = 0; col < this.size; col++) {
          this.valueOptions[row][col] = new Set(combs.map(g => g[col]))
        }
      }
    }
    // use the col sums to eliminate options
    for (let col = 0; col < this.size; col++) {
      if (this.colSums[col] !== undefined) {
        const colValueOptions = this.valueOptions.map((options, row) => Array.from(options[col]));
        const combs = combinations(colValueOptions).filter(g =>
          g.reduce((agg, c) => c + agg, 0) === this.colSums[col] &&
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