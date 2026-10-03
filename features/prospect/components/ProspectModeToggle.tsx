import { Lifebuoy } from "../../../components/atoms/Icons";

export type ProspectMode = "whatif" | "emergency";

interface Props {
  mode: ProspectMode;
  onChange: (mode: ProspectMode) => void;
}

/** The "Emergency mode" switch: off is the what-if simulator, on is the runway. */
export function ProspectModeToggle({ mode, onChange }: Props) {
  const on = mode === "emergency";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      className={`glass glass--tap toggle${on ? " is-on" : ""}`}
      onClick={() => onChange(on ? "whatif" : "emergency")}
    >
      <Lifebuoy size={16} />
      <span className="label">Emergency mode</span>
      <span className="track" aria-hidden="true">
        <span className="thumb" />
      </span>

      <style jsx>{`
        .toggle {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px 8px 14px;
          border-radius: var(--r-pill);
          font-family: inherit;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--fg-1);
          cursor: pointer;
        }

        .toggle.is-on {
          color: var(--accent-hot);
        }

        .track {
          position: relative;
          width: 34px;
          height: 20px;
          border-radius: var(--r-pill);
          background: var(--glass-field);
          border: 1px solid var(--glass-rim);
          transition: background 160ms ease;
        }

        .is-on .track {
          background: var(--accent-hot);
          border-color: transparent;
        }

        .thumb {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--fg-0);
          transition: transform 160ms ease;
        }

        .is-on .thumb {
          transform: translateX(14px);
          background: var(--on-accent);
        }

        @media (prefers-reduced-motion: reduce) {
          .track,
          .thumb {
            transition: none;
          }
        }
      `}</style>
    </button>
  );
}
