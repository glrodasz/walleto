import type { ReactNode } from "react";
import { Close, Lightbulb } from "../../../components/atoms/Icons";
import { useLocalPreference } from "../../../hooks/useLocalPreference";

interface Props {
  /** Stable id: once dismissed, this tip stays dismissed in this browser. */
  id: string;
  children: ReactNode;
}

/** A one-line hint at the foot of the page, dismissable for good. */
export function TipBanner({ id, children }: Props) {
  const [dismissed, setDismissed] = useLocalPreference(`waletto:tip:${id}`, false);
  if (dismissed) return null;
  return (
    <div className="glass tip" role="note">
      <span className="icon" aria-hidden="true">
        <Lightbulb size={16} />
      </span>
      <p className="text">
        <strong>Tip:</strong> {children}
      </p>
      <button
        type="button"
        className="close"
        aria-label="Dismiss tip"
        onClick={() => setDismissed(true)}
      >
        <Close size={16} />
      </button>
      <style jsx>{`
        .tip {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: var(--r-lg);
        }

        .icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          color: var(--accent);
          background: var(--accent-soft);
          flex-shrink: 0;
        }

        .text {
          flex: 1;
          margin: 0;
          font-size: 0.82rem;
          color: var(--fg-1);
        }

        .close {
          display: inline-flex;
          border: none;
          background: transparent;
          color: var(--fg-2);
          cursor: pointer;
          padding: 4px;
          border-radius: var(--r-sm);
        }

        .close:hover {
          color: var(--fg-0);
          background: var(--glass-hover);
        }
      `}</style>
    </div>
  );
}
