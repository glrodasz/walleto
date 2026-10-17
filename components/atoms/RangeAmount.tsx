interface Props {
  /** Both ends already formatted, so privacy mode and codes apply to each. */
  from: string;
  to: string;
}

/**
 * A variable expense's band in a row's amount slot. On one line it reads
 * "€400 – €600"; on a phone the two ends stack, because a range is twice an
 * amount's width and, kept on one line, squeezed the row's name to nothing.
 */
export function RangeAmount({ from, to }: Props) {
  return (
    <span className="range">
      <span className="end">{from} –</span> <span className="end">{to}</span>
      <style jsx>{`
        .range {
          display: inline-flex;
          column-gap: 0.3em;
        }

        .end {
          white-space: nowrap;
        }

        @media (max-width: 767px) {
          .range {
            flex-direction: column;
            align-items: flex-end;
          }
        }
      `}</style>
    </span>
  );
}
