import type { ReactNode } from "react";
import { Button } from "../../../components/atoms/Button";
import { ArrowLeft, ArrowRight } from "../../../components/atoms/Icons";

interface Props {
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  busy?: boolean;
  error?: string | null;
  /** Left-hand slot, e.g. ContinueLater. */
  leading?: ReactNode;
}

export function WizardActions({ onBack, onNext, nextLabel = "Next", busy, error, leading }: Props) {
  return (
    <div className="actions">
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="row">
        {leading && <div className="leading">{leading}</div>}
        <div className="buttons">
          {onBack && (
            <Button variant="ghost" onClick={onBack} disabled={busy}>
              <ArrowLeft size={16} />
              Back
            </Button>
          )}
          <Button variant="primary" onClick={onNext} disabled={busy}>
            {busy ? "Saving…" : nextLabel}
            {!busy && <ArrowRight size={16} />}
          </Button>
        </div>
      </div>

      <style jsx>{`
        .actions {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 10px;
          width: 100%;
        }

        .row {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 16px;
          width: 100%;
        }

        .leading {
          margin-right: auto;
          min-width: 0;
        }

        .buttons {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .error {
          margin: 0;
          font-size: 0.8125rem;
          color: var(--accent-hot);
        }
      `}</style>
    </div>
  );
}
