export interface TabOption {
  key: string;
  label: string;
  /** Border and tint of the active tab; the neutral foreground by default. */
  accent?: string;
}

interface Props {
  tabs: TabOption[];
  value: string;
  onChange: (key: string) => void;
  /** Accessible name of the strip ("Domain", "Section"). */
  label: string;
}

/**
 * Outlined tabs, equal width; on narrow screens they become one scrollable
 * row so six sections never squeeze into unreadable slivers.
 */
export function TabStrip({ tabs, value, onChange, label }: Props) {
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          role="tab"
          aria-selected={value === t.key}
          className={`tab${value === t.key ? " is-active" : ""}`}
          style={{ "--tab-accent": t.accent ?? "var(--fg-0)" } as React.CSSProperties}
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
        }

        .tab {
          min-height: 36px;
          padding: 0 10px;
          border: 1px solid var(--line);
          border-radius: var(--r-sm);
          background: var(--bg-2);
          color: var(--fg-2);
          font-family: inherit;
          font-size: 0.78rem;
          font-weight: 600;
          white-space: nowrap;
          cursor: pointer;
        }

        .tab.is-active {
          border-color: var(--tab-accent);
          color: var(--tab-accent);
          background: color-mix(in srgb, var(--tab-accent) 12%, transparent);
        }

        @media (max-width: 480px) {
          .tabs {
            display: flex;
            overflow-x: auto;
            scrollbar-width: none;
            scroll-snap-type: x proximity;
            padding-bottom: 2px;
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
