import { MethodFace } from "./MethodFace";
import type { MethodFaceProps } from "./types";

interface Props extends MethodFaceProps {
  /** The spoken name — the face itself is aria-hidden. */
  label: string;
  onClick: () => void;
  /** For a face that opens and closes something (the wallet's editor). */
  expanded?: boolean;
  controls?: string;
}

/** A face you can tap: lifts under the pointer, sinks when pressed. */
export function MethodFaceButton({ label, onClick, expanded, controls, ...face }: Props) {
  return (
    <button
      type="button"
      className={`face-button face-button--${face.size ?? "compact"}`}
      aria-label={label}
      aria-expanded={expanded}
      aria-controls={controls}
      onClick={onClick}
    >
      <MethodFace {...face} />

      <style jsx>{`
        .face-button {
          display: block;
          width: 100%;
          padding: 0;
          border: none;
          background: none;
          color: inherit;
          font: inherit;
          text-align: left;
          cursor: pointer;
          border-radius: var(--r-md);
          transition: transform 180ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .face-button--full {
          max-width: 360px;
        }

        .face-button:hover {
          transform: translateY(-1px);
        }

        .face-button:active {
          transform: scale(0.99);
        }

        .face-button:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 3px;
        }

        @media (prefers-reduced-motion: reduce) {
          .face-button {
            transition: none;
          }

          .face-button:hover,
          .face-button:active {
            transform: none;
          }
        }
      `}</style>
    </button>
  );
}
