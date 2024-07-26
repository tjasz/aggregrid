import { randomInts, countingSequence, shuffleArray } from "./algorithm";

export default class Grid {
  // basic properties of the grid
  size: number;
  maxValue: number;
  uniqueValues: boolean;

  // values of the grid
  values: number[][];
  rowSums: number[];
  colSums: number[];
  rowProducts: number[];
  colProducts: number[];

  constructor(newSize?: number, newMaxValue?: number, newUniqueValues?: boolean) {
    // set the basic properties
    this.size = newSize ?? 3;
    this.maxValue = newMaxValue ?? this.size * this.size;
    this.uniqueValues = newUniqueValues ?? true;
    if (this.uniqueValues && this.maxValue < this.size * this.size) {
      throw new Error(`If values must be unique, the max value must be at least ${this.size * this.size} for a ${this.size} x ${this.size} board.`);
    }

    // set the values
    const source = this.uniqueValues
      ? shuffleArray(countingSequence(this.maxValue))
      : randomInts(this.size * this.size, this.maxValue + 1, 1);
    this.values = [];
    this.rowSums = new Array(this.size).fill(0);
    this.colSums = new Array(this.size).fill(0);
    this.rowProducts = new Array(this.size).fill(1);
    this.colProducts = new Array(this.size).fill(1);
    for (let row = 0; row < this.size; row++) {
      this.values.push([]);
      for (let col = 0; col < this.size; col++) {
        const value = source[row * this.size + col];
        this.values[row].push(value);
        this.rowSums[row] += value;
        this.colSums[col] += value;
        this.rowProducts[row] *= value;
        this.colProducts[col] *= value;
      }
    }
  }
}