import { primeFactors } from "./algorithm";

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
    [210, [2, 3, 5, 7]],
    [2310, [2, 3, 5, 7, 11]],
  ])("primeFactors(%p) = %p", (args: number, expected: number[]) => {
    const res = primeFactors(args);
    expect(res).toEqual(expected);
  })
});