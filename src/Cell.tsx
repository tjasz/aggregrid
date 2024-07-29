import { KeyboardEventHandler } from "react";
import { countingSequence } from "./algorithm";

export type CellProps = {
  value?: number;
  options: number[];
  maxValue: number;
  onSetValue: (v: number | undefined) => void;
  onSetOptions: (o: number[]) => void;
  onClick: () => void;
  tabIndex: number;
  selected: boolean;
}
export function Cell({ value, options, maxValue, onSetValue, onSetOptions, onClick, tabIndex, selected }: CellProps) {
  const handleKey: KeyboardEventHandler<HTMLTableCellElement> = e => {
    switch (e.code) {
      case 'Digit1':
      case 'Digit2':
      case 'Digit3':
      case 'Digit4':
      case 'Digit5':
      case 'Digit6':
      case 'Digit7':
      case 'Digit8':
      case 'Digit9':
        const value = parseInt(e.code.slice(5));
        e.shiftKey ? onSetOptions(options.includes(value) ? options.filter(v => v !== value) : [...options, value]) : onSetValue(value);
        break;
      case 'Backspace':
      case 'Delete':
        onSetValue(undefined);
        break;
    }
  }
  return <td tabIndex={tabIndex} onKeyDown={handleKey} onClick={onClick} className={selected ? "selected" : ""}>
    {value
      ? <div className="value">{value}</div>
      : <div className="optionsContainer">
        {
          countingSequence(maxValue).map(o => (
            <span
              key={o}
              style={{
                visibility: `${options.includes(o) ? "visible" : "hidden"}`,
                color: `hsl(${300 * o / maxValue},50%,50%)`
              }}
              className={maxValue > 9 ? "option4" : "option3"}
            >
              {o}
            </span>
          ))
        }
      </div>}
  </td>
}