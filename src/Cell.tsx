import { KeyboardEventHandler } from "react";
import { countingSequence } from "./algorithm";
import { ValidationState } from "./ValidationState";

export type CellProps = {
  value?: number;
  validationState: ValidationState;
  options: number[];
  maxValue: number;
  onClick: () => void;
  tabIndex: number;
  selected: boolean;
}
export function Cell({ value, validationState, options, maxValue, onClick, tabIndex, selected }: CellProps) {
  return <td tabIndex={tabIndex} onClick={onClick} className={selected ? "selected" : ""}>
    {value
      ? <div className="value" style={{
        color:
          validationState === ValidationState.Invalid
            ? "red"
            : validationState === ValidationState.Valid
              ? "green"
              : "black"
      }}>{value}</div>
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