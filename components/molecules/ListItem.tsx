import type { ReactNode } from "react";
import Link from "next/link";
import { ProgressBar } from "./ProgressBar";

interface BodyProps {
  /** What identifies the row at a glance: an IconDisc, a DateBadge. */
  leading?: ReactNode;
  name: ReactNode;
  /**
   * Flag pills, riding the right end of the name line. Always `Badge` — a
   * hand-rolled span has no `white-space: nowrap`, which is how
   * "HIDDEN ON CHART" ended up split across two lines.
   */
  badges?: ReactNode;
  /**
   * One line of secondary facts, already joined ("Sep 25 · Monthly · Housing").
   * Pass it as a single string: some rows are asserted as one text node.
   */
  meta?: ReactNode;
  note?: ReactNode;
  /** A share bar under the text block. */
  progress?: { ratio: number; color: string; label: string };
  /** The row's number, preformatted (formatAmount / formatNative). */
  amount?: ReactNode;
  /** Under the amount: a status pill, the charged pair, a gain. */
  amountMeta?: ReactNode;
}

interface Props extends BodyProps {
  /** A kebab, a button, a chevron. Stays outside the clickable area. */
  trailing?: ReactNode;
  onClick?: () => void;
  href?: string;
  /** Dim the row: hidden, skipped, archived. */
  muted?: boolean;
  /** Accessible name of the row's own button, when its text is not enough. */
  "aria-label"?: string;
}

/**
 * The row's contents, as its own component on purpose: styled-jsx only stamps
 * its scope hash on JSX a component returns itself, so markup parked in a
 * `const` (or returned by a helper) compiles with bare class names and its CSS
 * dies silently. That is exactly what left the Tags list unstyled.
 */
function ListItemBody({
  leading,
  name,
  badges,
  meta,
  note,
  progress,
  amount,
  amountMeta,
}: BodyProps) {
  return (
    <>
      {leading && <span className="leading">{leading}</span>}
      <span className="main">
        <span className="name-line">
          <span className="name">{name}</span>
          {badges && <span className="badges">{badges}</span>}
        </span>
        {meta && <span className="meta">{meta}</span>}
        {note && <span className="note">{note}</span>}
        {progress && (
          <span className="progress">
            <ProgressBar
              ratio={progress.ratio}
              color={progress.color}
              height={6}
              label={progress.label}
            />
          </span>
        )}
      </span>
      {(amount || amountMeta) && (
        <span className="value">
          {amount && <span className="amount">{amount}</span>}
          {amountMeta && <span className="amount-meta">{amountMeta}</span>}
        </span>
      )}

      <style jsx>{`
        .leading {
          display: inline-flex;
          flex-shrink: 0;
        }

        .main {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        /* The badges ride the end of this line rather than taking one of their
           own, so a flag never costs the row a second line. */
        .name-line {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .name {
          flex: 1 1 auto;
          min-width: 0;
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--fg-0);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .badges {
          margin-left: auto;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
          /* A Badge is nowrap, so without this a long flag overflows the text
             column and paints over the amount on a narrow screen. */
          max-width: 100%;
          overflow: hidden;
        }

        .meta,
        .note {
          font-size: 0.75rem;
          color: var(--fg-2);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .progress {
          display: block;
          max-width: 260px;
          margin-top: 2px;
        }

        .value {
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 3px;
        }

        .amount {
          font-family: var(--font-mono, "JetBrains Mono", ui-monospace, monospace);
          font-variant-numeric: tabular-nums;
          font-size: 0.95rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--fg-0);
          white-space: nowrap;
        }

        .amount-meta {
          font-size: 0.72rem;
          color: var(--fg-2);
          white-space: nowrap;
        }

        @media (max-width: 767px) {
          .name,
          .amount {
            font-size: 0.9rem;
          }

          /* On a phone the facts line is the first thing to run out of room.
             One line hides the method, the frequency and the origin; wrapping
             freely makes a five-line row. Two lines, then the ellipsis. */
          .meta,
          .note {
            white-space: normal;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
          }
        }
      `}</style>
    </>
  );
}

/**
 * One row of a list: the name and the number first, everything else quieter.
 *
 * Every list in the app used to draw its own, and they drifted — names at
 * 0.85/0.88/0.9rem, amounts at four sizes and often no weight at all, so a
 * row's primary number read lighter than its label. The scale lives here now,
 * once: two size steps and a weight step, nothing else.
 */
export function ListItem({
  trailing,
  onClick,
  href,
  muted = false,
  "aria-label": ariaLabel,
  ...body
}: Props) {
  return (
    <li className={`row${muted ? " is-muted" : ""}`}>
      {href ? (
        <Link href={href} className="hit" aria-label={ariaLabel}>
          <ListItemBody {...body} />
        </Link>
      ) : onClick ? (
        <button type="button" className="hit" onClick={onClick} aria-label={ariaLabel}>
          <ListItemBody {...body} />
        </button>
      ) : (
        <span className="hit">
          <ListItemBody {...body} />
        </span>
      )}
      {trailing && <span className="trailing">{trailing}</span>}

      <style jsx>{`
        .row {
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 1px solid var(--line);
        }

        .row:last-child {
          border-bottom: none;
        }

        /* Dim the content, never the <li>: opacity on the row makes it a
           stacking context, which used to bury an open kebab menu under the
           rows below it — and greyed out the very control you reach for to
           un-hide the thing. */
        .is-muted > :global(.hit) {
          opacity: 0.55;
        }

        /* Link is a child component, so its className carries no scope hash. */
        .row > :global(.hit) {
          flex: 1;
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
          border: none;
          background: transparent;
          font-family: inherit;
          text-align: left;
          color: inherit;
          text-decoration: none;
        }

        .row > :global(button.hit),
        .row > :global(a.hit) {
          cursor: pointer;
        }

        /* The name belongs to the body component's scope, hence :global(). */
        .row > :global(button.hit:hover) :global(.name),
        .row > :global(a.hit:hover) :global(.name) {
          color: var(--accent);
        }

        .trailing {
          display: inline-flex;
          align-items: center;
          flex-shrink: 0;
        }
      `}</style>
    </li>
  );
}

/** The <ul> these rows live in: no bullets, no gaps — the rows carry the rules. */
export function ListItems({ children }: { children: ReactNode }) {
  return (
    <ul className="list">
      {children}
      <style jsx>{`
        .list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
        }
      `}</style>
    </ul>
  );
}
