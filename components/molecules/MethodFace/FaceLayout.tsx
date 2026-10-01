import type { FaceSlots, MethodFaceSize } from "./types";

interface Props {
  size: MethodFaceSize;
  slots: FaceSlots;
}

/**
 * The one geometry every face shares. A kind picks its material (the frame)
 * and fills the slots; where things sit, how big they are and the type
 * scale live here only — that's what keeps a check, a card and a banknote
 * looking like one family.
 *
 *   compact   emblem  title   aside        full   title     corner
 *             emblem  meta    aside               emblem
 *                                                 detail
 *                                                 footer    mark
 */
export function FaceLayout({ size, slots }: Props) {
  const full = size === "full";

  return (
    <div className={`layout layout--${size}`}>
      <span className="emblem">{slots.emblem}</span>
      <span className={`title${slots.muted ? " title--muted" : ""}`}>{slots.title}</span>
      {full ? (
        <>
          {slots.corner && <span className="corner">{slots.corner}</span>}
          {slots.detail && <span className="detail">{slots.detail}</span>}
          {slots.footer && <span className="footer">{slots.footer}</span>}
          {slots.mark && <span className="mark">{slots.mark}</span>}
        </>
      ) : (
        <>
          {slots.meta && <span className="meta">{slots.meta}</span>}
          {slots.aside && <span className="aside">{slots.aside}</span>}
        </>
      )}

      <style jsx>{`
        .layout {
          flex: 1;
          min-width: 0;
          display: grid;
          column-gap: 12px;
          color: var(--ink);
        }

        .layout--compact {
          grid-template-columns: 40px minmax(0, 1fr) auto;
          grid-template-areas:
            "emblem title aside"
            "emblem meta aside";
          align-content: center;
          row-gap: 2px;
          /* --reserve keeps text clear of what a material draws at its edge (a ticket's stub). */
          padding: 12px calc(14px + var(--reserve, 0px)) 12px 14px;
        }

        .layout--full {
          grid-template-columns: minmax(0, 1fr) auto;
          grid-template-rows: auto 1fr auto auto;
          grid-template-areas:
            "title corner"
            "emblem emblem"
            "detail detail"
            "footer mark";
          row-gap: 8px;
          padding: 18px calc(20px + var(--reserve, 0px)) 18px 20px;
        }

        .emblem {
          grid-area: emblem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .layout--full .emblem {
          justify-content: flex-start;
          align-self: center;
        }

        .title {
          grid-area: title;
          min-width: 0;
          align-self: end;
          font-size: 0.95rem;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .layout--full .title {
          align-self: start;
          letter-spacing: 0.01em;
        }

        .title--muted {
          color: var(--ink-soft);
          font-weight: 500;
        }

        .meta {
          grid-area: meta;
          min-width: 0;
          align-self: start;
          font-size: 0.75rem;
          color: var(--ink-soft);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .aside {
          grid-area: aside;
          justify-self: end;
          align-self: center;
          display: flex;
          justify-content: flex-end;
          min-width: 0;
          max-width: 10rem;
          font-size: 0.8rem;
          font-weight: 800;
          letter-spacing: 0.06em;
        }

        .corner {
          grid-area: corner;
          justify-self: end;
          align-self: start;
          padding-top: 3px;
          font-size: 0.64rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--ink-soft);
          white-space: nowrap;
        }

        .detail {
          grid-area: detail;
          min-width: 0;
        }

        .footer {
          grid-area: footer;
          align-self: end;
          min-width: 0;
          font-size: 0.75rem;
          color: var(--ink-soft);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .mark {
          grid-area: mark;
          justify-self: end;
          align-self: end;
          display: flex;
          justify-content: flex-end;
          max-width: 10rem;
          font-size: 1.1rem;
          font-weight: 800;
          letter-spacing: 0.06em;
        }
      `}</style>
    </div>
  );
}
