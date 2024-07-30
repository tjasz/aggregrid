import { useEffect, useState } from "react";
import { countingSequence } from "./algorithm";

export type NewGameFormProps = {
  onNewGame: (size: number, maxValue: number, uniqueValues: boolean) => void;
}

export function NewGameForm({ onNewGame }: NewGameFormProps) {
  const [size, setSize] = useState(3);
  const [uniqueValues, setUniqueValues] = useState(true);
  const [maxValue, setMaxValue] = useState(size * size);
  const [minMaxValue, setMinMaxValue] = useState(uniqueValues ? size * size : 1);
  useEffect(() => {
    const newMin = uniqueValues ? size * size : 1;
    setMinMaxValue(newMin);
    if (maxValue < newMin) {
      setMaxValue(newMin);
    }
  }, [uniqueValues, size])

  return <div id="newGameForm">
    <label htmlFor="size">Size</label>
    <select name="size" onChange={e => setSize(parseInt(e.target.value))} defaultValue={size}>
      <option value="2">2x2</option>
      <option value="3">3x3</option>
      <option value="4">4x4</option>
    </select>
    <br />
    <label htmlFor="uniqueValues">Unique Values</label>
    <input type="checkbox" name="uniqueValues" onChange={e => setUniqueValues(e.target.checked)} defaultChecked={uniqueValues} />
    <br />
    <label htmlFor="maxValue">Max Value</label>
    <select name="maxValue" onChange={e => setMaxValue(parseInt(e.target.value))} defaultValue={size * size}>
      {countingSequence(20, minMaxValue).map(n => (<option key={n} value={n}>{n}</option>))}
    </select>
    <br />
    <button onClick={() => onNewGame(size, maxValue, uniqueValues)}>New Puzzle</button>
  </div>
}