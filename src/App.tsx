import React, { KeyboardEventHandler, useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import Grid from './grid';
import Puzzle, { Solver } from './puzzle';
import { countingSequence } from './algorithm';
import { Cell } from './Cell';

function App() {
  const [size, setSize] = useState(3);
  const [uniqueValues, setUniqueValues] = useState(true);
  const [puzzle, setPuzzle] = useState(new Puzzle(size, undefined, uniqueValues));
  const [cellValues, setCellValues] = useState<(number | undefined)[]>(new Array(size * size).fill(undefined));
  const [selectedCell, setSelectedCell] = useState<undefined | [number, number]>(undefined);

  const getNewPuzzle = () => {
    setPuzzle(new Puzzle(size, undefined, uniqueValues));
    setCellValues(new Array(size * size).fill(undefined));
    setSelectedCell(undefined);
  }

  const setCellValue = (i: number, j: number, v: number | undefined) => {
    setCellValues(cellValues.map((oldValue, idx) => idx === i * size + j ? v : oldValue))
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
                  value={cellValues[i * size + j]}
                  options={[]}
                  onSetValue={v => setCellValue(i, j, v)}
                  onClick={() => setSelectedCell([i, j])}
                  tabIndex={i * size + j}
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
        {countingSequence(puzzle.maxValue).map(n => (
          <button onClick={() => {
            if (selectedCell) {
              setCellValue(selectedCell[0], selectedCell[1], n);
            }
          }}>{n}</button>
        ))}
      </div>
      <div id="newGameForm">
        <label htmlFor="uniqueValues">Unique Values</label>
        <input type="checkbox" name="uniqueValues" onChange={e => setUniqueValues(e.target.checked)} checked={uniqueValues} />
        <select onChange={e => setSize(parseInt(e.target.value))} value={size}>
          <option value="3">3</option>
          <option value="4">4</option>
        </select>
        <button onClick={getNewPuzzle}>New Puzzle</button>
      </div>
    </div>
  );
}

export default App;
