import type { CSSProperties } from "react";
import { CheckboxField } from "../../../components/atoms/CheckboxField";
import { useRecurrentStep } from "../hooks/useRecurrentStep";
import { CADENCE_SECTIONS } from "../helpers/cadenceSections";
import type { CadenceSection } from "../helpers/cadenceSections";
import { paymentMethodOptionLabel } from "../../../helpers/paymentMethodLabel";
import { sortByName } from "../../../helpers/paymentMethodOptions";
import { BACKFILL_MONTHS } from "../../../helpers/scheduleAnchor";
import type { Domain } from "../../../types";
import { CadencePanel } from "./CadencePanel";
import { RecurrentRowEditor } from "./RecurrentRowEditor";

interface Props {
  state: ReturnType<typeof useRecurrentStep>;
  showPaymentMethod?: boolean;
}

const NOUN: Partial<Record<Domain, string>> = { INCOME: "income", EXPENSE: "expense" };

/**
 * The Income / Expenses step: monthly first and largest, everything else
 * apart under "Less often", each cadence a panel of its own — tinted with the
 * step's domain colour, like its tab in the stepper.
 */
export function RecurrentStep({ state, showPaymentMethod = false }: Props) {
  const { domain, rows, addTo, update, removeAt, categories, methods, backfill, setBackfill } =
    state;

  const categoryOptions = categories
    .filter((c) => !c.parentId)
    .map((c) => ({ value: c.id!, label: c.name }));

  const methodOptions = showPaymentMethod
    ? sortByName(methods).map((m) => ({ value: m.id!, label: paymentMethodOptionLabel(m) }))
    : undefined;

  const noun = NOUN[domain] ?? "item";
  const rowsIn = (section: CadenceSection) =>
    rows.filter((r) => section.frequencies.includes(r.frequency));
  const primary = CADENCE_SECTIONS.filter((s) => s.primary);
  const secondary = CADENCE_SECTIONS.filter((s) => !s.primary);

  return (
    <div
      className="step"
      style={{ "--step-accent": `var(--domain-${domain.toLowerCase()})` } as CSSProperties}
    >
      <div className="backfill">
        <CheckboxField
          label={`Backfill recurring items for the last ${BACKFILL_MONTHS} months`}
          hint="So your charts and totals have history from day one."
          checked={backfill}
          onChange={setBackfill}
        />
      </div>

      {primary.map((section) => (
        <CadencePanel
          key={section.id}
          section={section}
          noun={noun}
          count={rowsIn(section).length}
          onAdd={() => addTo(section.defaultFrequency)}
        >
          {rowsIn(section).map((row) => (
            <RecurrentRowEditor
              key={row.key}
              row={row}
              section={section}
              categoryOptions={categoryOptions}
              methodOptions={methodOptions}
              onChange={(patch) => update(row.key, patch)}
              onRemove={() => removeAt(row.key)}
            />
          ))}
        </CadencePanel>
      ))}

      <div className="secondary">
        <h3 className="secondary-title">Less often</h3>
        {secondary.map((section) => (
          <CadencePanel
            key={section.id}
            section={section}
            noun={noun}
            count={rowsIn(section).length}
            onAdd={() => addTo(section.defaultFrequency)}
          >
            {rowsIn(section).map((row) => (
              <RecurrentRowEditor
                key={row.key}
                row={row}
                section={section}
                categoryOptions={categoryOptions}
                methodOptions={methodOptions}
                onChange={(patch) => update(row.key, patch)}
                onRemove={() => removeAt(row.key)}
              />
            ))}
          </CadencePanel>
        ))}
      </div>

      <style jsx>{`
        .step {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .backfill {
          padding: 12px 14px;
          border: 1px solid var(--glass-rim);
          border-radius: var(--r-md);
          background: var(--glass-inset);
        }

        .secondary {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding-top: 20px;
          border-top: 1px solid var(--line);
        }

        .secondary-title {
          margin: 0;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--fg-2);
        }
      `}</style>
    </div>
  );
}
