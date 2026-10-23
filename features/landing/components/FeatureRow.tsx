import type { CSSProperties, ReactNode } from "react";

interface Props {
  eyebrow: string;
  title: string;
  body: string;
  /** Domain or accent colour for the icon and eyebrow, so each row reads as its area. */
  color: string;
  /** The icon the app uses for this area. */
  icon: ReactNode;
  /** The drawing of the feature (decorative: the copy says the same). */
  art: ReactNode;
  /** Every other row puts the drawing on the left. */
  flip?: boolean;
}

/** One thing an account gets: what it is on one side, a drawing of it on the other. */
export function FeatureRow({ eyebrow, title, body, color, icon, art, flip }: Props) {
  return (
    <article
      className={`row${flip ? " row--flip" : ""}`}
      style={{ "--row-color": color } as CSSProperties}
    >
      <div className="copy">
        <p className="eyebrow">
          <span className="icon" aria-hidden="true">
            {icon}
          </span>
          {eyebrow}
        </p>
        <h3>{title}</h3>
        <p className="body">{body}</p>
      </div>
      <div className="art">{art}</div>
      <style jsx>{`
        .row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          align-items: center;
          gap: 72px;
        }

        .row--flip .copy {
          order: 2;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin: 0 0 16px;
          /* The icon keeps the pure colour; the small caps text needs 4.5:1. */
          color: color-mix(in srgb, var(--row-color) 55%, var(--fg-0));
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 11px;
          color: var(--row-color);
          background: color-mix(in srgb, var(--row-color) 14%, transparent);
          border: 1px solid color-mix(in srgb, var(--row-color) 28%, transparent);
        }

        h3 {
          margin: 0 0 14px;
          font-size: clamp(1.6rem, 1.1rem + 1.6vw, 2.4rem);
          line-height: 1.12;
          letter-spacing: -0.03em;
          color: var(--fg-0);
        }

        .body {
          margin: 0;
          max-width: 46ch;
          color: var(--fg-1);
          font-size: 1.05rem;
          line-height: 1.6;
        }

        .art {
          padding: 12px;
        }

        @media (max-width: 899px) {
          .row {
            grid-template-columns: minmax(0, 1fr);
            gap: 28px;
          }

          .row--flip .copy {
            order: 0;
          }

          .art {
            padding: 0 8px;
          }
        }
      `}</style>
    </article>
  );
}
