export type DomainView = "categories" | "transactions" | "recurring";

interface Props {
  value: DomainView;
  onChange: (view: DomainView) => void;
  accent: string;
}

const VIEWS: { key: DomainView; label: string }[] = [
  { key: "categories", label: "Categories" },
  { key: "transactions", label: "Transactions" },
  { key: "recurring", label: "Recurring" },
];

/** Three views of the same month: aggregated, raw, and the plan. */
export function ViewTabs({ value, onChange, accent }: Props) {
  return (
    <div className="tabs" role="tablist" aria-label="View">
      {VIEWS.map((v) => (
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
          grid-template-columns: repeat(3, 1fr);
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
