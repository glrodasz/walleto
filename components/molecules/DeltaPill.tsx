import { ArrowDown, ArrowUp } from "../atoms/Icons";

interface Props {
  /** Percentage change; the sign decides the arrow. */
  pct: number;
  /** Is a rise good news? Spending more is not; earning more is. */
  upIsGood: boolean;
  label?: string;
}

/** "↑ 12%" tinted by whether the move is good for its domain. */
export function DeltaPill({ pct, upIsGood, label }: Props) {
  const up = pct > 0;
  const good = up ? upIsGood : !upIsGood;
  const Arrow = up ? ArrowUp : ArrowDown;
  return (
    <span
      className={`pill ${good ? "good" : "bad"}`}
      aria-label={label ?? `${up ? "Up" : "Down"} ${Math.abs(pct).toFixed(0)}%`}
    >
      <Arrow size={12} />
      {Math.abs(pct).toFixed(0)}%
      <style jsx>{`
        .pill {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          padding: 4px 8px;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 700;
          line-height: 1;
          white-space: nowrap;
        }

        .good {
          color: var(--domain-income);
          background: color-mix(in srgb, var(--domain-income) 14%, transparent);
        }

        .bad {
          color: var(--accent-hot);
          background: color-mix(in srgb, var(--accent-hot) 14%, transparent);
        }
      `}</style>
    </span>
  );
}
