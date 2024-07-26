import { countingSequence, factorizations, intersect } from "./algorithm";
import Grid from "./grid";

export default class Puzzle {
  // basic properties of the grid
  size: number;
  maxValue: number;
  uniqueValues: boolean;
  allowedValues: Set<number>;

  // aggregate hints
  rowSums: (number | undefined)[];
  colSums: (number | undefined)[];
  rowProducts: (number | undefined)[];
  colProducts: (number | undefined)[];
  valueOptions: Set<number>[][];

  constructor(grid: Grid) {
    this.size = grid.size;
    this.maxValue = grid.maxValue;
    this.uniqueValues = grid.uniqueValues;
    this.allowedValues = new Set(countingSequence(this.maxValue));

    this.rowSums = grid.rowSums;
    this.rowProducts = grid.rowProducts;
    this.colSums = grid.colSums;
    this.colProducts = grid.colProducts;

    // start out by setting the allowed values for each cell to the entire puzzle set
    this.valueOptions = [];
    for (let i = 0; i < this.size; i++) {
      this.valueOptions.push([]);
      for (let j = 0; j < this.size; j++) {
        this.valueOptions[i].push(new Set(this.allowedValues));
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

  solve() {
    // use the product and sum clues to eliminate options
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        // limit value options for this cell by its row product
        if (this.rowProducts[i] !== undefined) {
          const rowFactorOptions = factorizations(this.rowProducts[i]!, this.size)
            .filter(factorization =>
              factorization.every(n => this.allowedValues.has(n)) &&
              (!this.uniqueValues || factorization.length === new Set(factorization).size) &&
              factorization.some(n => this.valueOptions[i][j].has(n))
            )
            .flat();
          this.valueOptions[i][j] = intersect(this.valueOptions[i][j], new Set(rowFactorOptions));
        }
        // further limit value options for this cell by its column product
        if (this.colProducts[j] !== undefined) {
          const colFactorOptions = factorizations(this.colProducts[j]!, this.size)
            .filter(factorization =>
              factorization.every(n => this.allowedValues.has(n)) &&
              (!this.uniqueValues || factorization.length === new Set(factorization).size) &&
              factorization.some(n => this.valueOptions[i][j].has(n))
            )
            .flat();
          this.valueOptions[i][j] = intersect(this.valueOptions[i][j], new Set(colFactorOptions));
        }
      }
    }
  }
}