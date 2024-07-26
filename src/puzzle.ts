import { countingSequence, factorizations } from "./algorithm";
import Grid from "./grid";

export default class Puzzle {
  // basic properties of the grid
  size: number;
  maxValue: number;
  uniqueValues: boolean;

  // aggregate hints
  rowSums: (number | undefined)[];
  colSums: (number | undefined)[];
  rowProducts: (number | undefined)[];
  colProducts: (number | undefined)[];

  constructor(grid: Grid) {
    this.size = grid.size;
    this.maxValue = grid.maxValue;
    this.uniqueValues = grid.uniqueValues;
    this.rowSums = grid.rowSums;
    this.rowProducts = grid.rowProducts;
    this.colSums = grid.colSums;
    this.colProducts = grid.colProducts;
  }

  solve() {
    const allowedValues = countingSequence(this.maxValue);

    let valueOptions: number[][][] = [];
    for (let i = 0; i < this.size; i++) {
      valueOptions.push([]);
      for (let j = 0; j < this.size; j++) {
        valueOptions[i].push(allowedValues.slice());
        // limit value options for this cell by its row product
        if (this.rowProducts[i] !== undefined) {
          const rowFactorOptions = factorizations(this.rowProducts[i]!, this.size)
            .filter(factorization =>
              factorization.every(n => allowedValues.includes(n)) &&
              (!this.uniqueValues || factorization.length === new Set(factorization).size) &&
              factorization.some(n => valueOptions[i][j].includes(n))
            )
            .flat();
          valueOptions[i][j] = rowFactorOptions;
        }
        // further limit value options for this cell by its column product
        if (this.colProducts[j] !== undefined) {
          const colFactorOptions = factorizations(this.colProducts[j]!, this.size)
            .filter(factorization =>
              factorization.every(n => allowedValues.includes(n)) &&
              (!this.uniqueValues || factorization.length === new Set(factorization).size) &&
              factorization.some(n => valueOptions[i][j].includes(n))
            )
            .flat();
          valueOptions[i][j] = Array.from(new Set(valueOptions[i][j]).intersection(new Set(colFactorOptions)));
        }
      }
    }
    console.log(valueOptions);
  }
}