import { Button } from "../atoms/Button";
import { Trash } from "../atoms/Icons";
import { useT } from "../../hooks/useT";
import { COMMON_MESSAGES } from "../../messages/common";

interface Props {
  /** Absent: nothing to remove (the item can't be removed right now). */
  onRemove?: () => void;
  /** The Remove button's accessible name, naming the item ("Remove Rent"). */
  removeLabel?: string;
  /** Absent: an editor that is always open (Income / Expenses rows). */
  onDone?: () => void;
  doneLabel?: string;
}

/**
 * The action row at the bottom of an editable item: `Remove | Done`, right
 * aligned, dismissive before primary like every action row. Removing is never
 * an icon-only × in a column beside the fields — that cost every field its
 * width on a phone — it's this "Remove", in the danger colour.
 */
export function EditorFooter({ onRemove, removeLabel, onDone, doneLabel }: Props) {
  const tc = useT(COMMON_MESSAGES);
  return (
    <div className="editor-footer">
      {onRemove && (
        <Button variant="danger" size="sm" aria-label={removeLabel} onClick={onRemove}>
          <Trash size={16} />
          {tc("action.remove")}
        </Button>
      )}
      {onDone && (
        <Button variant="secondary" size="sm" onClick={onDone}>
          {doneLabel ?? tc("action.done")}
        </Button>
      )}

      <style jsx>{`
        .editor-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
        }
      `}</style>
    </div>
  );
}
