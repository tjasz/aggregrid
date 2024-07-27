import React from 'react';
import logo from './logo.svg';
import './App.css';
import Grid from './grid';
import Puzzle from './puzzle';
import { countingSequence } from './algorithm';

function App() {
  const puzzle = new Puzzle(new Grid(4));
  //puzzle.solve();

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
                  {JSON.stringify(Array.from(puzzle.valueOptions[i][j]))}
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
      </header>
    </div>
  );
}

export default App;
