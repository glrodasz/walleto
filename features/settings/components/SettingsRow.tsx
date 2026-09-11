import type { ReactNode } from "react";
import { ChevronRight, ExternalLink } from "../../../components/atoms/Icons";

interface Props {
  label: string;
  /** Plain text on the right, when the row is informational. */
  value?: ReactNode;
  /** A control on the right (a select, a segmented control) instead of text. */
  control?: ReactNode;
  /** Grey text after the control, explaining it. */
  hint?: string;
  /** Makes the row a link (external ones get the arrow icon)… */
  href?: string;
  /** …or a button. */
  onClick?: () => void;
  danger?: boolean;
}

/** One "label · value" line of a Settings card; a chevron when it leads somewhere. */
export function SettingsRow({ label, value, control, hint, href, onClick, danger }: Props) {
  const external = href?.startsWith("http") || href?.startsWith("mailto:");
  const interactive = Boolean(href || onClick);
  const body = (
    <>
      <span className="label">{label}</span>
      <span className="right">
        {control && <span className="control">{control}</span>}
        {value !== undefined && <span className="value">{value}</span>}
        {hint && <span className="hint">{hint}</span>}
        {interactive && (
          <span className="chevron" aria-hidden="true">
            {external ? <ExternalLink size={15} /> : <ChevronRight size={16} />}
          </span>
        )}
      </span>
    </>
  );

  return (
    <div className={`row${danger ? " danger" : ""}`}>
      {href ? (
        <a
          className="hit"
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noreferrer" : undefined}
        >
          {body}
        </a>
      ) : onClick ? (
        <button type="button" className="hit" onClick={onClick}>
          {body}
        </button>
      ) : (
        <div className="hit">{body}</div>
      )}
      <style jsx>{`
        .row {
          border-bottom: 1px solid var(--line);
        }

        .row:last-child {
          border-bottom: none;
        }

        .hit {
          width: 100%;
          display: grid;
          grid-template-columns: minmax(120px, 180px) minmax(0, 1fr);
          align-items: center;
          gap: 12px;
          min-height: 48px;
          padding: 6px 0;
          border: none;
          background: transparent;
          font-family: inherit;
          text-align: left;
          color: inherit;
          text-decoration: none;
        }

        button.hit,
        a.hit {
          cursor: pointer;
        }

        .label {
          font-size: 0.88rem;
          color: var(--fg-1);
        }

        .right {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .control {
          flex-shrink: 0;
          min-width: 150px;
        }

        .value {
          flex: 1;
          min-width: 0;
          font-size: 0.88rem;
          color: var(--fg-0);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .hint {
          flex: 1;
          min-width: 0;
          font-size: 0.75rem;
          color: var(--fg-2);
        }

        .chevron {
          margin-left: auto;
          display: inline-flex;
          color: var(--fg-2);
        }

        .danger {
          margin-top: 8px;
          border-radius: var(--r-md);
          border: 1px solid color-mix(in srgb, var(--accent-hot) 30%, transparent);
          background: color-mix(in srgb, var(--accent-hot) 8%, transparent);
        }

        .danger .hit {
          padding: 6px 12px;
        }

        .danger .label {
          color: var(--accent-hot);
          font-weight: 600;
        }

        @media (max-width: 480px) {
          .hit {
            grid-template-columns: 1fr;
            gap: 4px;
            padding: 10px 0;
          }

          .right {
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  );
}
