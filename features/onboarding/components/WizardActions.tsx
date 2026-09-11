import { Button } from "../../../components/atoms/Button";
import { ArrowLeft, ArrowRight } from "../../../components/atoms/Icons";

interface Props {
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  busy?: boolean;
  error?: string | null;
}

export function WizardActions({ onBack, onNext, nextLabel = "Next", busy, error }: Props) {
  return (
    <div className="actions">
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
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

      <style jsx>{`
        .actions {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 10px;
          width: 100%;
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
