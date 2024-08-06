import Puzzle from "./puzzle";
import { Solver } from "./Solver";

// regression test case for error where initial valueOptions in solver
// got set to 0 options for this puzzle
describe("solve", () => {
  it.each<[number, number]>([
    [1, 1],
  ])("solve", (args: number, expected: number) => {
    const puzzle = new Puzzle(3);
    puzzle.rowSums = [17, 16, 12];
    puzzle.rowProducts = [112, 54, 60];
    puzzle.colSums = [20, 14, 11];
    puzzle.colProducts = [252, 40, 36];
    const solver = new Solver(puzzle);
    expect(Array.from(solver.valueOptions[0][0]).sort()).toEqual([4, 7]);
    expect(Array.from(solver.valueOptions[0][1]).sort()).toEqual([1, 2, 4, 8]);
    expect(Array.from(solver.valueOptions[0][2]).sort()).toEqual([1, 2, 4]);
  })
});