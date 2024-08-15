import { useState } from 'react';
import './App.css';
import Puzzle from './puzzle';
import { countingSequence, multiset, primeFactors } from './algorithm';
import { Cell } from './Cell';
import { NewGameForm } from './NewGameForm';
import { ValidationState } from './ValidationState';

function App() {
  const [puzzle, setPuzzle] = useState<undefined | Puzzle>(undefined);
  const [cellValues, setCellValues] = useState<(number | undefined)[]>(new Array(9).fill(undefined));
  const [cellOptions, setCellOptions] = useState<number[][]>(new Array(9).fill([]));
  const [validationState, setValidationState] = useState<ValidationState[]>(new Array(9).fill(ValidationState.Unchecked));
  const [selectedCell, setSelectedCell] = useState<undefined | [number, number]>(undefined);
  const [inputMode, setInputMode] = useState(true);

  const getNewPuzzle = (size: number, maxValue: number, uniqueValues: boolean) => {
    setPuzzle(new Puzzle(size, maxValue, uniqueValues));
    setCellValues(new Array(size * size).fill(undefined));
    setCellOptions(new Array(size * size).fill([]));
    setValidationState(new Array(size * size).fill(ValidationState.Unchecked));
    setSelectedCell(undefined);
  }

  if (puzzle === undefined) {
    return <NewGameForm onNewGame={getNewPuzzle} />
  }

  const setCellValue = (i: number, j: number, v: number | undefined) => {
    setCellValues(cellValues.map((oldValue, idx) => idx === i * puzzle.size + j ? v : oldValue))
    setValidationState(validationState.map((oldValue, idx) => idx === i * puzzle.size + j ? ValidationState.Unchecked : oldValue))
  }

  const setOptionsForCell = (i: number, j: number, o: number[]) => {
    setCellOptions(cellOptions.map((oldValue, idx) => idx === i * puzzle.size + j ? o : oldValue))
  }

  return (
    <div id="game">
      <p>
        Arrange the numbers 1-{puzzle.maxValue} in the {puzzle.size}x{puzzle.size} grid.&nbsp;
        {puzzle.uniqueValues
          ? puzzle.maxValue === puzzle.size * puzzle.size
            ? "Each number must appear exactly once."
            : "Each number may only appear once."
          : "A number may appear multiple times."}
      </p>
      <table>
        <tbody>
          <tr>
            <th>&#931;</th>
            {puzzle.colSums.map((n, j) => (<th key={j}>
              {n}
              <div className="remainder">
                {n ? n - cellValues.reduce<number>((agg, v, idx) => idx % puzzle.size === j ? agg + (v ?? 0) : agg, 0) || undefined : undefined}
              </div>
            </th>))}
            <th></th>
          </tr>
          {countingSequence(puzzle.size).map((row, i) => (
            <tr key={i}>
              <th>
                {puzzle.rowSums[i]}
                <div className="remainder">
                  {puzzle.rowSums[i] ? puzzle.rowSums[i]! - cellValues.reduce<number>((agg, v, idx) => Math.floor(idx / puzzle.size) === i ? agg + (v ?? 0) : agg, 0) || undefined : undefined}
                </div>
              </th>
              {countingSequence(puzzle.size).map((n, j) => (
                <Cell
                  key={i * puzzle.size + j}
                  value={cellValues[i * puzzle.size + j]}
                  validationState={validationState[i * puzzle.size + j]}
                  options={cellOptions[i * puzzle.size + j]}
                  maxValue={puzzle.maxValue}
                  onClick={() => setSelectedCell([i, j])}
                  tabIndex={i * puzzle.size + j}
                  selected={selectedCell !== undefined && selectedCell[0] === i && selectedCell[1] === j}
                />
              ))}
              <th>
                {puzzle.rowProducts[i]}
                < div className="remainder" >
                  {puzzle.rowProducts[i] ? Object.entries(multiset(primeFactors(puzzle.rowProducts[i]! / cellValues.reduce<number>((agg, v, idx) => Math.floor(idx / puzzle.size) === i ? agg * (v ?? 1) : agg, 1)))).map(
                    kv => kv[1] > 1 ? `${kv[0]}^${kv[1]}` : kv[0]
                  ).join(" * ") : undefined}
                </div>
              </th>
            </tr>
          ))}
          <tr>
            <th></th>
            {puzzle.colProducts.map((n, i) => (<th key={i}>
              {n}
              <div className="remainder">
                {n ? Object.entries(multiset(primeFactors(n / cellValues.reduce<number>((agg, v, idx) => idx % puzzle.size === i ? agg * (v ?? 1) : agg, 1)))).map(
                  kv => kv[1] > 1 ? `${kv[0]}^${kv[1]}` : kv[0]
                ).join(" * ") : undefined}
              </div>
            </th>))}
            <th>&#928;</th>
          </tr>
        </tbody>
      </table >
      <div id="numberButtons">
        <label htmlFor="inputMode">Value</label>
        <input type="checkbox" name="inputMode" checked={inputMode} onChange={() => setInputMode(!inputMode)} />
        <button onClick={() => {
          if (selectedCell) {
            if (cellValues[selectedCell[0] * puzzle.size + selectedCell[1]]) {
              setCellValue(selectedCell[0], selectedCell[1], undefined)
            }
            else {
              setOptionsForCell(selectedCell[0], selectedCell[1], [])
            }
          }
        }}>x</button>
        <br />
        {countingSequence(puzzle.maxValue).map(n => (
          <span key={n}>
            <button key={n} disabled={selectedCell === undefined || (inputMode || !cellOptions[selectedCell[0] * puzzle.size + selectedCell[1]].includes(n)) && puzzle.uniqueValues && cellValues.includes(n)} onClick={() => {
              if (selectedCell) {
                const options = cellOptions[selectedCell[0] * puzzle.size + selectedCell[1]];
                inputMode
                  ? setCellValue(selectedCell[0], selectedCell[1], n)
                  : setOptionsForCell(selectedCell[0], selectedCell[1], options.includes(n) ? options.filter(v => v !== n) : [...options, n]);
              }
            }}>{n}</button>
            {n % (puzzle.maxValue > 9 ? 4 : 3) === 0 ? <br /> : undefined}
          </span>
        ))}
        <br />
        <button onClick={() => {
          if (selectedCell) {
            navigator.clipboard.writeText(JSON.stringify(cellOptions[selectedCell[0] * puzzle.size + selectedCell[1]]))
          }
        }}>Copy</button>
        <button onClick={() => {
          if (selectedCell) {
            navigator.clipboard.readText().then(text => {
              const clipboardValue = JSON.parse(text);
              if (Array.isArray(clipboardValue) && clipboardValue.length > 0 && typeof clipboardValue[0] === "number") {
                setOptionsForCell(selectedCell[0], selectedCell[1], clipboardValue)
              }
            })
          }
        }}>Paste</button>
        <br />
        <button onClick={() => {
          const correctValues = puzzle.grid.values.flat();
          setValidationState(correctValues.map((v, i) => {
            return cellValues[i] === undefined
              ? ValidationState.Unchecked
              : cellValues[i] === v
                ? ValidationState.Valid
                : ValidationState.Invalid
          }))
        }}>Validate</button>
        <br />
        <button onClick={() => {
          setCellValues(new Array(puzzle.size * puzzle.size).fill(undefined));
          setCellOptions(new Array(puzzle.size * puzzle.size).fill([]));
        }}>Clear All</button>
        <br />
        <button onClick={() => getNewPuzzle(puzzle.size, puzzle.maxValue, puzzle.uniqueValues)}>New Puzzle</button>
      </div>
    </div >
  );
}

export default App;
