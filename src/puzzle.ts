import { cartesianProduct, countingSequence, factorizations, intersect, shuffle, triangular } from "./algorithm";
import debug from "./debug";
import Grid from "./grid";
import { Solver } from "./Solver";

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

    // if puzzle is not solvable with every hint enabled, get a new grid
    let i = 0;
    do {
      this.grid = new Grid(size, maxValue, uniqueValues);

      this.size = this.grid.size;
      this.maxValue = this.grid.maxValue;
      this.uniqueValues = this.grid.uniqueValues;

      this.rowSums = this.grid.rowSums.slice();
      this.rowProducts = this.grid.rowProducts.slice();
      this.colSums = this.grid.colSums.slice();
      this.colProducts = this.grid.colProducts.slice();
      i++;
    } while (i < 10 && !new Solver(this).solve());

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

  hasHint(choice: number) {
    if (choice < this.size) {
      return this.rowSums[choice] !== undefined;
    }
    else if (choice < 2 * this.size) {
      return this.rowProducts[choice - this.size] !== undefined;
    }
    else if (choice < 3 * this.size) {
      return this.colSums[choice - 2 * this.size] !== undefined;
    }
    else if (choice < 4 * this.size) {
      return this.colProducts[choice - 3 * this.size] !== undefined;
    }
    else {
      throw (`Cannot check existence of hint #${choice} in a ${this.size} x ${this.size} grid.`)
    }
  }

  harden() {
    // remove all hints that are not essential to solving the puzzle
    let countRemoved = 1;
    for (let round = 0; countRemoved > 0 && round < 10; round++) {
      countRemoved = 0;
      const hintOrder = shuffle(countingSequence(4 * this.size - 1, 0));
      for (const hint of hintOrder) {
        // remove hint if it is not essential to solving this puzzle
        if (this.hasHint(hint)) {
          this.removeHint(hint);
          if (!new Solver(this).solve()) {
            this.restoreHint(hint);
          }
          else {
            countRemoved++;
          }
        }
      }
      debug(`Round ${round} hardening: removed ${countRemoved} hints.`)
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