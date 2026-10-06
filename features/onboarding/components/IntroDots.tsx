interface Props {
  count: number;
  index: number;
  onSelect: (index: number) => void;
}

/** The tour's dots: where you are, and a jump to any slide. */
export function IntroDots({ count, index, onSelect }: Props) {
  return (
    <ol className="dots">
      {Array.from({ length: count }, (_, n) => (
        <li key={n}>
          <button
            type="button"
            className={`dot${n === index ? " dot--current" : ""}`}
            aria-label={`Slide ${n + 1} of ${count}`}
            aria-current={n === index ? "step" : undefined}
            onClick={() => onSelect(n)}
          >
            <span className="pip" />
          </button>
        </li>
      ))}

      <style jsx>{`
        /* Closer to the scene than the stage gap: they belong to it. */
        .dots {
          list-style: none;
          margin: -12px 0 -4px;
          padding: 0;
          display: flex;
          gap: 2px;
        }

        /* A 24px hit area around a small pip. */
        .dot {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          padding: 0;
          border: none;
          background: none;
          cursor: pointer;
        }

        .pip {
          width: 8px;
          height: 8px;
          border-radius: var(--r-pill);
          background: var(--line-strong);
          transition:
            width 240ms cubic-bezier(0.22, 1, 0.36, 1),
            background 240ms;
        }

        .dot:hover .pip {
          background: var(--fg-2);
        }

        .dot--current .pip,
        .dot--current:hover .pip {
          width: 22px;
          background: var(--accent);
        }

        @media (max-width: 767px) {
          .dots {
            margin: -6px 0 -8px -2px;
            padding: 0 6px;
          }
        }
      `}</style>
    </ol>
  );
}
