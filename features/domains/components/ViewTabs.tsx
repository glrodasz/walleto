export type DomainView = "categories" | "transactions" | "recurring" | "value";

interface Props {
  value: DomainView;
  onChange: (view: DomainView) => void;
  accent: string;
  /** Investments add a fourth view: what each category is worth. */
  showValue?: boolean;
}

const VIEWS: { key: DomainView; label: string }[] = [
  { key: "categories", label: "Categories" },
  { key: "transactions", label: "Transactions" },
  { key: "recurring", label: "Recurring" },
];

/** Three views of the same month: aggregated, raw, and the plan (+ value for investments). */
export function ViewTabs({ value, onChange, accent, showValue }: Props) {
  const views = showValue ? [...VIEWS, { key: "value" as DomainView, label: "Value" }] : VIEWS;
  return (
    <div className="tabs" role="tablist" aria-label="View">
      {views.map((v) => (
        <button
          key={v.key}
          type="button"
          role="tab"
          aria-selected={value === v.key}
          className={`tab${value === v.key ? " is-active" : ""}`}
          onClick={() => onChange(v.key)}
        >
          {v.label}
        </button>
      ))}

      <style jsx>{`
        .tabs {
          display: grid;
          grid-template-columns: repeat(${showValue ? 4 : 3}, 1fr);
          gap: 4px;
          padding: 4px;
          border-radius: var(--r-md);
          background: var(--bg-2);
        }

        .tab {
          min-height: 40px;
          border: none;
          border-radius: var(--r-sm);
          background: transparent;
          color: var(--fg-2);
          font-family: inherit;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
        }

        .tab.is-active {
          background: var(--bg-1);
          color: var(--fg-0);
          box-shadow: inset 0 -2px 0 ${accent};
        }
      `}</style>
    </div>
  );
}
