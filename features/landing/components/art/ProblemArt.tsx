import Image from "next/image";

/**
 * The three small drawings on the problem cards: past bars with an empty
 * slot for this month, spending next to money set aside, and a row of
 * currencies. Decorative — each card's text says the same thing.
 */
export function ProblemArt({ id }: { id: "1" | "2" | "3" }) {
  return (
    <div className={`mini mini--${id}`} aria-hidden="true">
      {id === "1" && (
        <>
          {[30, 52, 40, 62, 46].map((h, i) => (
            <i key={i} className="bar" style={{ height: `${h}px` }} />
          ))}
          <i className="bar bar--next" />
        </>
      )}
      {id === "2" && (
        <>
          <i className="block block--spent" />
          <i className="block block--kept" />
        </>
      )}
      {id === "3" && (
        <Image
          className="coins"
          src="/landing/coins.webp"
          alt=""
          width={960}
          height={253}
          sizes="(max-width: 599px) 90vw, 340px"
        />
      )}
      <style jsx>{`
        .mini {
          display: flex;
          align-items: flex-end;
          gap: 6px;
          height: 64px;
        }

        .bar {
          flex: 1;
          border-radius: 3px;
          background: var(--line-strong);
        }

        .bar--next {
          height: 52px;
          background: transparent;
          border: 2px dashed var(--accent);
        }

        .mini--2 {
          align-items: flex-start;
          gap: 10px;
        }

        .block {
          height: 42px;
          border-radius: 8px;
        }

        .block--spent {
          flex: 3;
          background: var(--domain-expense);
          opacity: 0.75;
        }

        .block--kept {
          flex: 2;
          background: color-mix(in srgb, var(--domain-saving) 22%, transparent);
          border: 2px solid var(--domain-saving);
        }

        .mini--3 {
          height: auto;
        }

        /* A cut-out photo on transparency, so it sits on either theme. */
        .mini--3 :global(.coins) {
          display: block;
          width: 100%;
          max-width: 340px;
          height: auto;
          filter: drop-shadow(0 10px 12px rgba(15, 23, 42, 0.18));
        }
      `}</style>
    </div>
  );
}
