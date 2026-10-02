import { useId } from "react";
import { MethodFace, MethodFaceButton } from "../../../components/molecules/MethodFace";
import { paymentMethodDescription } from "../../../helpers/paymentMethodLabel";
import { MethodEditor } from "./MethodEditor";
import type { MethodRow } from "../hooks/useMethodsStep";

interface Props {
  row: MethodRow;
  open: boolean;
  attempted: boolean;
  /** Set after a failed save when this row is the reason. */
  problem: string | null;
  canRemove: boolean;
  onToggle: () => void;
  onClose: () => void;
  onChange: (patch: Partial<MethodRow>) => void;
  onRemove: () => void;
}

/**
 * One method in the wallet: its face, which opens and closes it, and — while
 * open — the face at full size with its fields beside it (under it on a
 * phone). A closed item mounts no fields, so nothing hidden holds a listener
 * or a dropdown portal.
 */
export function WalletItem({
  row,
  open,
  attempted,
  problem,
  canRemove,
  onToggle,
  onClose,
  onChange,
  onRemove,
}: Props) {
  const editorId = useId();
  const label = row.type
    ? paymentMethodDescription({
        name: row.name.trim() || "Untitled",
        type: row.type,
        network: row.network.trim() || undefined,
        last4: row.last4 || undefined,
      })
    : "New payment method";

  return (
    <div className={`item${open ? " item--open" : ""}`}>
      <div className="face-slot">
        {open ? (
          // Open: the face is just a preview. Closing is "Done"'s job — a
          // tappable preview closed the form by accident.
          row.type ? (
            <div className="preview">
              <MethodFace
                type={row.type}
                name={row.name}
                network={row.network}
                last4={row.last4}
                size="full"
                invalid={Boolean(problem)}
              />
            </div>
          ) : (
            <div className="placeholder" aria-hidden="true">
              Select a type first
            </div>
          )
        ) : (
          <MethodFaceButton
            label={label}
            expanded={false}
            onClick={onToggle}
            type={row.type}
            name={row.name}
            network={row.network}
            last4={row.last4}
            size="compact"
            invalid={Boolean(problem)}
          />
        )}
        {problem && !open && <p className="hint">{problem}</p>}
      </div>

      {open && (
        <MethodEditor
          id={editorId}
          row={row}
          attempted={attempted}
          problem={problem}
          canRemove={canRemove}
          onChange={onChange}
          onRemove={onRemove}
          onDone={onClose}
        />
      )}

      <style jsx>{`
        .item {
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-width: 0;
        }

        .item--open {
          padding: 16px;
          border-radius: var(--r-lg);
          border: 1px solid var(--glass-rim);
          background: var(--glass-inset);
        }

        .face-slot {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
        }

        .preview {
          max-width: 360px;
        }

        /* No type yet: an empty, dimmed slot — nothing to do here. */
        .placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          color: var(--fg-2);
          width: 100%;
          max-width: 360px;
          aspect-ratio: 1.586;
          border-radius: var(--r-md);
          border: 1px dashed var(--glass-rim);
          background: var(--glass-inset);
          opacity: 0.45;
          pointer-events: none;
        }

        /* On a phone the fields come first and the card preview after them. */
        .item--open .face-slot {
          order: 2;
        }

        .hint {
          margin: 0;
          font-size: 0.72rem;
          color: var(--accent-hot);
        }

        /* Wide enough: the object on the left, its fields on the right. */
        @media (min-width: 768px) {
          .item--open {
            display: grid;
            grid-template-columns: minmax(0, 320px) minmax(0, 1fr);
            align-items: start;
            gap: 24px;
            padding: 20px;
          }

          .item--open .face-slot {
            order: 0;
          }
        }
      `}</style>
    </div>
  );
}
