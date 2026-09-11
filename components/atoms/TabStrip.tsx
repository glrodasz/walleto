export interface TabOption {
  key: string;
  label: string;
  /** Underline and text colour of the active tab; the primary accent by default. */
  accent?: string;
}

interface Props {
  tabs: TabOption[];
  value: string;
  onChange: (key: string) => void;
  /** Accessible name of the strip ("Domain", "Section"). */
  label: string;
  /** Tint of the active tab when the option has none (a page's domain accent). */
  accent?: string;
}

/**
 * A segmented glass strip: equal-width tabs, the active one raised on a solid
 * surface with an accent underline. On narrow screens it becomes one
 * scrollable row so six sections never squeeze into unreadable slivers.
 */
export function TabStrip({ tabs, value, onChange, label, accent }: Props) {
  return (
    <div className="glass tabs" role="tablist" aria-label={label}>
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          role="tab"
          aria-selected={value === t.key}
          className={`tab${value === t.key ? " is-active" : ""}`}
          style={{ "--tab-accent": t.accent ?? accent ?? "var(--accent)" } as React.CSSProperties}
          onClick={() => onChange(t.key)}
        >
          {t.label}
        </button>
      ))}

      <style jsx>{`
        .tabs {
          display: grid;
          grid-template-columns: repeat(${tabs.length}, 1fr);
          gap: 4px;
          padding: 4px;
          border-radius: var(--r-lg);
        }

        .tab {
          min-height: 40px;
          padding: 0 12px;
          border: none;
          border-radius: var(--r-md);
          -webkit-tap-highlight-color: transparent;
          background: transparent;
          color: var(--fg-1);
          font-family: inherit;
          font-size: 0.85rem;
          font-weight: 600;
          white-space: nowrap;
          cursor: pointer;
          box-shadow: inset 0 -2px 0 transparent;
          transition:
            background 0.15s,
            color 0.15s,
            box-shadow 0.15s;
        }

        .tab:hover {
          color: var(--fg-0);
          background: var(--glass-hover);
        }

        /* The selected tab is a second, brighter pane raised out of the strip
           — lit along its top edge, with the accent underlining it. */
        .tab.is-active {
          background-color: var(--glass-raised);
          background-image: var(--glass-sheen);
          color: var(--tab-accent);
          box-shadow:
            inset 0 1px 0 var(--glass-edge),
            inset 0 -2px 0 var(--tab-accent),
            var(--glass-shadow);
        }

        @media (max-width: 600px) {
          .tabs {
            display: flex;
            overflow-x: auto;
            scrollbar-width: none;
            scroll-snap-type: x proximity;
          }

          .tabs::-webkit-scrollbar {
            display: none;
          }

          .tab {
            flex: 0 0 auto;
            scroll-snap-align: start;
          }
        }
      `}</style>
    </div>
  );
}
