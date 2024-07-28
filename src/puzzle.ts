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
    this.harden();
  }

  removeHint(choice: number) {
    if (choice < this.size) {
      this.rowSums[choice] = undefined;
    }
    else if (choice < 2 * this.size) {
      this.rowProducts[choice - this.size] = undefined;
    }
    else if (choice < 3 * this.size) {
      this.colSums[choice - 2 * this.size] = undefined
    }
    else if (choice < 4 * this.size) {
      this.colProducts[choice - 3 * this.size] = undefined;
    }
    else {
      throw (`Cannot remove hint #${choice} in a ${this.size} x ${this.size} grid.`)
    }
  }

  restoreHint(choice: number) {
    if (choice < this.size) {
      this.rowSums[choice] = this.grid.rowSums[choice];
    }
    else if (choice < 2 * this.size) {
      this.rowProducts[choice - this.size] = this.grid.rowProducts[choice - this.size];
    }
    else if (choice < 3 * this.size) {
      this.colSums[choice - 2 * this.size] = this.grid.colSums[choice - 2 * this.size]
    }
    else if (choice < 4 * this.size) {
      this.colProducts[choice - 3 * this.size] = this.grid.colProducts[choice - 3 * this.size];
    }
    else {
      throw (`Cannot restore hint #${choice} in a ${this.size} x ${this.size} grid.`)
    }
  }

  harden() {
    // remove all hints that are not essential to solving the puzzle
    let anyRemoved = true;
    for (let round = 0; anyRemoved && round < 10; round++) {
      anyRemoved = false;
      for (let hint = round === 0 ? Math.floor(Math.random() * 4 * this.size) : 0; hint < 4 * this.size; hint++) {
        // remove hint if it is not essential to solving this puzzle
        this.removeHint(hint);
        if (!new Solver(this).solve()) {
          this.restoreHint(hint);
        }
        else {
          anyRemoved = true;
        }
      }
    }
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