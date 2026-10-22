import type { CSSProperties, ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Colour of the soft glow behind the card — usually the feature's domain. */
  glow?: string;
  /** Degrees; a slight tilt makes the vector art read as an object, not a screenshot. */
  tilt?: number;
  className?: string;
}

/**
 * The frame every landing illustration sits in: a pane of glass with a
 * coloured glow. The `art-*` classes are the shared vocabulary inside it —
 * rows, amounts, status words — so each illustration only lays them out.
 */
export function ArtCard({ children, glow = "var(--accent)", tilt = 0, className }: Props) {
  return (
    <div
      className={`art${className ? ` ${className}` : ""}`}
      style={{ "--art-glow": glow, "--art-tilt": `${tilt}deg` } as CSSProperties}
      aria-hidden="true"
    >
      {children}
      <style jsx>{`
        .art {
          position: relative;
          padding: 20px;
          border-radius: 22px;
          background: var(--glass-raised);
          background-image: linear-gradient(
            160deg,
            color-mix(in srgb, var(--art-glow) 7%, transparent),
            transparent 60%
          );
          border: 1px solid var(--glass-rim);
          box-shadow:
            inset 0 1px 0 var(--glass-edge),
            0 30px 60px -32px color-mix(in srgb, var(--art-glow) 55%, transparent),
            0 0 90px -30px color-mix(in srgb, var(--art-glow) 45%, transparent);
          transform: rotate(var(--art-tilt));
          color: var(--fg-0);
          font-size: 0.85rem;
        }

        .art :global(.art-label) {
          color: var(--fg-2);
          font-size: 0.75rem;
        }

        .art :global(.art-num) {
          font-family: var(--font-mono), ui-monospace, monospace;
          font-variant-numeric: tabular-nums;
        }

        .art :global(.art-big) {
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: clamp(1.6rem, 1.2rem + 1.2vw, 2.1rem);
          font-weight: 700;
          letter-spacing: -0.02em;
          line-height: 1.1;
        }

        .art :global(.art-rows) {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .art :global(.art-row) {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 12px;
          background: var(--glass-strong);
          border: 1px solid var(--line);
        }

        .art :global(.art-row strong) {
          font-weight: 600;
        }

        .art :global(.art-sub) {
          display: block;
          color: var(--fg-2);
          font-size: 0.7rem;
          margin-top: 2px;
        }

        .art :global(.art-status) {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .art :global(.art-status--paid) {
          color: var(--domain-income);
        }

        .art :global(.art-status--due) {
          color: var(--domain-saving);
        }

        .art :global(.art-status--overdue) {
          color: var(--domain-expense);
        }

        .art :global(.art-tiles) {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
        }

        .art :global(.art-tile) {
          padding: 10px;
          border-radius: 12px;
          background: var(--glass-strong);
          border: 1px solid var(--line);
          min-width: 0;
        }

        .art :global(.art-dot) {
          display: inline-block;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          margin-right: 6px;
          background: currentColor;
        }

        @media (prefers-reduced-motion: no-preference) {
          .art {
            transition: transform 400ms cubic-bezier(0.22, 1, 0.36, 1);
          }

          .art:hover {
            transform: rotate(0deg) translateY(-4px);
          }
        }
      `}</style>
    </div>
  );
}
