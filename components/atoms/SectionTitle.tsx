import Link from "next/link";
import type { ReactNode } from "react";
import { InfoTip } from "./InfoTip";
import { useT } from "../../hooks/useT";
import { UI_MESSAGES } from "../../messages/ui";

interface Props {
  title: string;
  /** One line under the title saying what the numbers are. */
  subtitle?: string;
  /** Background behind an "i" beside the title: how to read the section, not what it is. */
  info?: string;
  /** "View all" as a link… */
  href?: string;
  /** …or as a button, when it changes something on the same page. */
  onAction?: () => void;
  actionLabel?: string;
  /** Anything else at the right edge (a select, a segmented control). */
  children?: ReactNode;
}

export function SectionTitle({
  title,
  subtitle,
  info,
  href,
  onAction,
  actionLabel,
  children,
}: Props) {
  const t = useT(UI_MESSAGES);
  const action = actionLabel ?? t("section.viewAll");
  return (
    <div className="header">
      <div className="text">
        {info ? (
          <div className="title-row">
            <h2 className="title">{title}</h2>
            <InfoTip label={t("field.moreInfo")} placement="bottom">
              {info}
            </InfoTip>
          </div>
        ) : (
          <h2 className="title">{title}</h2>
        )}
        {subtitle && <p className="subtitle">{subtitle}</p>}
      </div>
      <div className="right">
        {children}
        {href && (
          <Link href={href} className="action">
            {action}
          </Link>
        )}
        {!href && onAction && (
          <button type="button" className="action" onClick={onAction}>
            {action}
          </button>
        )}
      </div>
      <style jsx>{`
        .header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .text {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }

        .title {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 700;
          letter-spacing: -0.01em;
          color: var(--fg-0);
        }

        .subtitle {
          margin: 0;
          font-size: 0.8rem;
          color: var(--fg-2);
        }

        .right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .right :global(.action) {
          display: inline-flex;
          align-items: center;
          min-height: 32px;
          padding: 0 12px;
          border: 1px solid var(--glass-rim);
          border-radius: var(--r-pill);
          background: var(--glass-inset);
          color: var(--fg-1);
          font-family: inherit;
          font-size: 0.78rem;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          transition:
            color 0.15s,
            border-color 0.15s;
        }

        .right :global(.action:hover) {
          color: var(--fg-0);
          border-color: var(--line-strong);
        }

        /*
         * On a phone the controls win the row and the title loses it: .right
         * holds its max-content width (two selects ask for ~310px), so the
         * heading is squeezed to one word per line and the controls overflow
         * on top of it. Stack instead, controls first — they are what the
         * reader is reaching for — with the title and subtitle under them.
         * The DOM order stays title → controls, so reading and focus order do
         * not change.
         */
        @media (max-width: 767px) {
          .header {
            flex-direction: column;
            align-items: stretch;
          }

          .right {
            order: -1;
            flex-shrink: 1;
            flex-wrap: wrap;
          }

          /* The children are components, so their classes carry no scope hash. */
          .right > :global(*) {
            flex: 1 1 140px;
            min-width: 0;
          }
        }
      `}</style>
    </div>
  );
}
