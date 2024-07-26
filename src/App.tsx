import React from 'react';
import logo from './logo.svg';
import './App.css';
import Grid from './grid';

function App() {
  const grid = new Grid();

  return (
    <div className="App">
      <header className="App-header">
        <table>
          <tbody>
            <tr>
              <th>&#931;</th>
              {grid.colSums.map((n, i) => (<th key={i}>{n}</th>))}
              <th></th>
            </tr>
            {grid.values.map((row, i) => (
              <tr key={i}>
                <th>{grid.rowSums[i]}</th>
                {row.map((n, j) => (<td key={j}>{n}</td>))}
                <th>{grid.rowProducts[i]}</th>
              </tr>
            ))}
            <tr>
              <th></th>
              {grid.colProducts.map((n, i) => (<th key={i}>{n}</th>))}
              <th>&#928;</th>
            </tr>
          </tbody>
        </table>
      </header>
    </div>
  );
}

export default App;
