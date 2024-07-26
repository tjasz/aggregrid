import { factorizations, partitions, primeFactors } from "./algorithm";

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
      [[1, 2], [3]], // 100
      [[2], [1, 3]], // 101
      [[1], [2, 3]], // 110
      [[], [1, 2, 3]], // 111
    ]],
    [[[1, 2], 3], [
      [[1, 2], [], []], // 00
      [[2], [1], []], // 01
      [[2], [], [1]], // 02
      [[1], [2], []], // 10
      [[], [1, 2], []], // 11
      [[], [2], [1]], // 12
      [[1], [], [2]], // 20
      [[], [1], [2]], // 21
      [[], [], [1, 2]], // 22
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
    [[4, 2], [[4, 1], [2, 2], [2, 2], [1, 4]]],
  ])("factorizations(%p) = %p", (args: [number, number], expected: number[][]) => {
    const res = factorizations(...args);
    expect(res).toEqual(expected);
  })
});