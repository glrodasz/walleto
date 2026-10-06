import type { ReactNode } from "react";

/** The accent kicker above an intro slide's title, or beside a step's lead. */
export function IntroLabel({ children }: { children: ReactNode }) {
  return (
    <p className="label">
      {children}
      <style jsx>{`
        .label {
          display: inline-flex;
          margin: 0;
          padding: 5px 12px;
          border-radius: var(--r-pill);
          background: var(--accent-soft);
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--accent);
        }
      `}</style>
    </p>
  );
}
