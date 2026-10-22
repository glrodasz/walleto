import type { ReactNode } from "react";
import type { Language } from "../../../types";
import { Shot } from "./Shot";
import type { ShotId } from "../data/shots";

interface Props {
  eyebrow: string;
  title: string;
  body: string;
  shot: ShotId;
  shotAlt: string;
  language: Language;
  /** Domain or accent colour for the eyebrow, so each row reads as its area. */
  color: string;
  icon: ReactNode;
  /** Every other row puts the screenshot on the left. */
  flip?: boolean;
}

/** One thing an account gets: what it is on one side, the real screen on the other. */
export function FeatureRow({
  eyebrow,
  title,
  body,
  shot,
  shotAlt,
  language,
  color,
  icon,
  flip,
}: Props) {
  return (
    <article className={`row${flip ? " row--flip" : ""}`}>
      <div className="copy" style={{ "--row-color": color } as React.CSSProperties}>
        <p className="eyebrow">
          {icon}
          {eyebrow}
        </p>
        <h3>{title}</h3>
        <p className="body">{body}</p>
      </div>
      <Shot
        id={shot}
        language={language}
        alt={shotAlt}
        sizes="(max-width: 899px) 100vw, 620px"
        className="row-shot"
      />
      <style jsx>{`
        .row {
          display: grid;
          grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
          align-items: center;
          gap: 48px;
        }

        .row--flip .copy {
          order: 2;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 10px;
          color: var(--row-color);
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        h3 {
          margin: 0 0 12px;
          font-size: clamp(1.4rem, 1.1rem + 1vw, 1.9rem);
          line-height: 1.2;
          letter-spacing: -0.02em;
          color: var(--fg-0);
        }

        .body {
          margin: 0;
          color: var(--fg-1);
          font-size: 1rem;
          line-height: 1.6;
        }

        @media (max-width: 899px) {
          .row {
            grid-template-columns: minmax(0, 1fr);
            gap: 20px;
          }

          .row--flip .copy {
            order: 0;
          }
        }
      `}</style>
    </article>
  );
}
