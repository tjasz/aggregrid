import { useState } from "react";

export type NewGameFormProps = {
  onNewGame: (size: number, uniqueValues: boolean) => void;
}

export function NewGameForm({ onNewGame }: NewGameFormProps) {
  const [size, setSize] = useState(3);
  const [uniqueValues, setUniqueValues] = useState(true);

  return <div id="newGameForm">
    <label htmlFor="uniqueValues">Unique Values</label>
    <input type="checkbox" name="uniqueValues" onChange={e => setUniqueValues(e.target.checked)} defaultChecked={uniqueValues} />
    <select onChange={e => setSize(parseInt(e.target.value))} defaultValue={size}>
      <option value="2">2x2</option>
      <option value="3">3x3</option>
      <option value="4">4x4</option>
    </select>
    <br />
    <button onClick={() => onNewGame(size, uniqueValues)}>New Puzzle</button>
  </div>
}