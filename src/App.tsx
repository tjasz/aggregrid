import React, { useState } from 'react';
import logo from './logo.svg';
import './App.css';
import Grid from './grid';
import Puzzle, { Solver } from './puzzle';
import { countingSequence } from './algorithm';

function App() {
  const [size, setSize] = useState(3);
  const [uniqueValues, setUniqueValues] = useState(true);
  const [puzzle, setPuzzle] = useState(new Puzzle(size, undefined, uniqueValues));

  const getNewPuzzle = () => {
    setPuzzle(new Puzzle(size, undefined, uniqueValues))
  }

  return (
    <div className="App">
      <header className="App-header">
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
                {countingSequence(puzzle.size).map((n, j) => (<td key={n}>
                  <input type="text"></input>
                </td>))}
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
        <button onClick={getNewPuzzle}>New Puzzle</button>
      </header>
    </div>
  );
}

export default App;
