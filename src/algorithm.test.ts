import { cartesianProduct, combinations, factorizations, partitions, primeFactors } from "./algorithm";

describe("primeFactors", () => {
  it.each<[number, number[]]>([
    [1, []],
    [2, [2]],
    [4, [2, 2]],
    [6, [2, 3]],
    [8, [2, 2, 2]],
    [12, [2, 2, 3]],
    [16, [2, 2, 2, 2]],
    [24, [2, 2, 2, 3]],
    [30, [2, 3, 5]],
    [36, [2, 2, 3, 3]],
    [210, [2, 3, 5, 7]],
    [2310, [2, 3, 5, 7, 11]],
  ])("primeFactors(%p) = %p", (args: number, expected: number[]) => {
    const res = primeFactors(args);
    expect(res).toEqual(expected);
  })
});

describe("partitions", () => {
  it.each<[[number[], number], number[][][]]>([
    [[[1, 2, 3], 1], [
      [[1, 2, 3]],
    ]],
    [[[1, 2, 3], 2], [
      [[1, 2, 3], []], // 000
      [[2, 3], [1]], // 001
      [[1, 3], [2]], // 010
      [[3], [1, 2]], // 011
    ]],
    [[[1, 2], 3], [
      [[1, 2], [], []], // 00
      [[2], [1], []], // 01
      [[2], [], [1]], // 02
    ]],
  ])("partitions(%p) = %p", (args: [number[], number], expected: number[][][]) => {
    const res = partitions(...args);
    expect(res).toEqual(expected);
  })
});

describe("factorizations", () => {
  it.each<[[number, number], number[][]]>([
    [[1, 1], [[1]]],
    [[240, 1], [[240]]],
    [[4, 2], [[1, 4], [2, 2]]],
    [[16, 3], [
      [1, 1, 16],
      [1, 2, 8],
      [1, 4, 4],
      [2, 2, 4]
    ]],
  ])("factorizations(%p) = %p", (args: [number, number], expected: number[][]) => {
    const res = factorizations(...args);
    expect(res).toEqual(expected);
  })
});

describe("cartesianProduct", () => {
  it.each<[number[][], number[][]]>([
    [[[1, 2], [3, 4]], [[1, 3], [2, 3], [1, 4], [2, 4]]],
  ])("cartesianProduct(%p) = %p", (args: number[][], expected: number[][]) => {
    const res = cartesianProduct(args);
    expect(res).toEqual(expected);
  })
});

describe("combinations", () => {
  it.each<[number[], number, number[][]]>([
    [[], 0, [[]]],
    [[1, 2, 3], 0, [[]]],
    [[1, 2, 3], 1, [[1], [2], [3]]],
    [[1, 2, 3], 2, [[1, 2], [1, 3], [2, 3]]],
    [[1, 2, 3], 3, [[1, 2, 3]]],
    [[1, 3, 5, 7, 9], 2, [[1, 3], [1, 5], [1, 7], [1, 9], [3, 5], [3, 7], [3, 9], [5, 7], [5, 9], [7, 9]]],
  ])("combinations(%p) = %p", (options: number[], size: number, expected: number[][]) => {
    const res = combinations(options, size);
    expect(res).toEqual(expected);
  })
});