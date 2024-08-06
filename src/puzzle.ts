import { combinations, countingSequence, factorizations, intersect, triangular } from "./algorithm";
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
      const randomStartingHint = Math.floor(Math.random() * 4 * this.size);
      for (let hintOffset = 0; hintOffset < 4 * this.size; hintOffset++) {
        // remove hint if it is not essential to solving this puzzle
        const hint = (randomStartingHint + hintOffset) % (4 * this.size);
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