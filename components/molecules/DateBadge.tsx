interface Props {
  date: Date;
}

const MONTH = new Intl.DateTimeFormat("en", { month: "short" });

/** "SEP" over "21": the calendar-leaf date on upcoming payment rows. */
export function DateBadge({ date }: Props) {
  return (
    <span className="badge" aria-hidden="true">
      <span className="month">{MONTH.format(date)}</span>
      <span className="day">{date.getDate()}</span>
      <style jsx>{`
        .badge {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 44px;
          height: 44px;
          border-radius: var(--r-md);
          background: var(--bg-2);
          border: 1px solid var(--line);
          line-height: 1;
        }

        .month {
          font-size: 0.56rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--fg-2);
        }

        .day {
          margin-top: 2px;
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--fg-0);
          font-variant-numeric: tabular-nums;
        }
      `}</style>
    </span>
  );
}
