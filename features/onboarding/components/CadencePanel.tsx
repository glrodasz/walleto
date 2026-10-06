import type { ReactNode } from "react";
import { Chip } from "../../../components/atoms/Chip";
import type { CadenceSection } from "../helpers/cadenceSections";

interface Props {
  section: CadenceSection;
  /** "income" / "expense": the add chip names what it adds and how often. */
  noun: string;
  count: number;
  onAdd: () => void;
  /** The section's rows. */
  children?: ReactNode;
}

/**
 * One cadence of the Income / Expenses step, framed as its own panel with its
 * add chip inside: the chip under one group used to sit right on top of the
 * next one, and "Add" on yearly was easy to hit when monthly was meant. The
 * primary (monthly) panel is larger and tinted with the step's domain colour;
 * an empty secondary one folds into a single line.
 */
export function CadencePanel({ section, noun, count, onAdd, children }: Props) {
  const empty = count === 0;
  const label = section.addLabel(noun, !empty);
  const classes = [
    "panel",
    section.primary ? "panel--primary" : "panel--secondary",
    empty ? "panel--empty" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={classes} aria-labelledby={`cadence-${section.id}`}>
      <header className="head">
        <div className="titles">
          <h3 className="title" id={`cadence-${section.id}`}>
            {section.title}
          </h3>
          <p className="hint">{section.hint}</p>
        </div>
        {!section.primary && empty && (
          <Chip variant="add" onClick={onAdd}>
            {label}
          </Chip>
        )}
      </header>

      {!empty && <div className="rows">{children}</div>}

      {(section.primary || !empty) && (
        <div className="add">
          <Chip variant="add" onClick={onAdd}>
            {label}
          </Chip>
        </div>
      )}

      <style jsx>{`
        .panel {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 18px;
          border: 1px solid var(--glass-rim);
          border-radius: var(--r-lg, var(--r-md));
          background: var(--glass-inset);
        }

        .panel--primary {
          gap: 18px;
          padding: 22px;
          border-left: 3px solid var(--step-accent, var(--accent));
        }

        .panel--secondary.panel--empty {
          padding: 12px 16px;
        }

        .head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .titles {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .title {
          margin: 0;
          font-size: 0.9375rem;
          font-weight: 700;
          color: var(--fg-0);
        }

        .panel--primary .title {
          font-size: 1.0625rem;
          color: var(--step-accent, var(--fg-0));
        }

        .hint {
          margin: 0;
          font-size: 0.8125rem;
          color: var(--fg-2);
        }

        .rows {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
      `}</style>
    </section>
  );
}
