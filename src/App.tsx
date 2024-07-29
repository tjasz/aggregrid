import React, { KeyboardEventHandler, useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import Grid from './grid';
import Puzzle, { Solver } from './puzzle';
import { arrayEquals, countingSequence } from './algorithm';
import { Cell } from './Cell';

function App() {
  const [size, setSize] = useState(3);
  const [uniqueValues, setUniqueValues] = useState(true);
  const [puzzle, setPuzzle] = useState(new Puzzle(size, undefined, uniqueValues));
  const [cellValues, setCellValues] = useState<(number | undefined)[]>(new Array(size * size).fill(undefined));
  const [cellOptions, setCellOptions] = useState<number[][]>(new Array(size * size).fill([]));
  const [selectedCell, setSelectedCell] = useState<undefined | [number, number]>(undefined);
  const [inputMode, setInputMode] = useState(true);

  const getNewPuzzle = () => {
    setPuzzle(new Puzzle(size, undefined, uniqueValues));
    setCellValues(new Array(size * size).fill(undefined));
    setCellOptions(new Array(size * size).fill([]));
    setSelectedCell(undefined);
  }

  const setCellValue = (i: number, j: number, v: number | undefined) => {
    setCellValues(cellValues.map((oldValue, idx) => idx === i * puzzle.size + j ? v : oldValue))
  }

  const setOptionsForCell = (i: number, j: number, o: number[]) => {
    setCellOptions(cellOptions.map((oldValue, idx) => idx === i * puzzle.size + j ? o : oldValue))
  }

  return (
    <div id="game">
      <table>
        <tbody>
          <tr>
            <th>&#931;</th>
            {puzzle.colSums.map((n, i) => (<th key={i}>{n}</th>))}
            <th></th>
          </tr>
          {countingSequence(puzzle.size).map((row, i) => (
            <tr key={i}>
              <th>{puzzle.rowSums[i]}</th>
              {countingSequence(puzzle.size).map((n, j) => (
                <Cell
                  key={n}
                  value={cellValues[i * puzzle.size + j]}
                  options={cellOptions[i * puzzle.size + j]}
                  maxValue={puzzle.maxValue}
                  onSetValue={v => setCellValue(i, j, v)}
                  onSetOptions={o => setOptionsForCell(i, j, o)}
                  onClick={() => setSelectedCell([i, j])}
                  tabIndex={i * puzzle.size + j}
                  selected={selectedCell !== undefined && selectedCell[0] === i && selectedCell[1] === j}
                />
              ))}
              <th>{puzzle.rowProducts[i]}</th>
            </tr>
          ))}
          <tr>
            <th></th>
            {puzzle.colProducts.map((n, i) => (<th key={i}>{n}</th>))}
            <th>&#928;</th>
          </tr>
        </tbody>
      </table>
      <div id="numberButtons">
        <label htmlFor="inputMode">Value</label>
        <input type="checkbox" name="inputMode" checked={inputMode} onChange={() => setInputMode(!inputMode)} />
        <button onClick={() => {
          if (selectedCell) {
            setCellValue(selectedCell[0], selectedCell[1], undefined)
          }
        }}>x</button>
        <br />
        {countingSequence(puzzle.maxValue).map(n => (
          <>
            <button key={n} onClick={() => {
              if (selectedCell) {
                const options = cellOptions[selectedCell[0] * puzzle.size + selectedCell[1]];
                inputMode
                  ? setCellValue(selectedCell[0], selectedCell[1], n)
                  : setOptionsForCell(selectedCell[0], selectedCell[1], options.includes(n) ? options.filter(v => v !== n) : [...options, n].sort());
              }
            }}>{n}</button>
            {n % puzzle.size === 0 ? <br /> : undefined}
          </>
        ))}
        <button onClick={() => {
          if (arrayEquals(cellValues, puzzle.grid.values.flat())) {
            alert("Correct!")
          } else {
            alert("Incorrect or Incomplete.")
          }
        }}>Validate</button>
      </div>
      <div id="newGameForm">
        <label htmlFor="uniqueValues">Unique Values</label>
        <input type="checkbox" name="uniqueValues" onChange={e => setUniqueValues(e.target.checked)} checked={uniqueValues} />
        <select onChange={e => setSize(parseInt(e.target.value))} value={size}>
          <option value="3">3</option>
          <option value="4">4</option>
        </select>
        <br />
        <button onClick={getNewPuzzle}>New Puzzle</button>
      </div>
    </div>
  );
}

export default App;
