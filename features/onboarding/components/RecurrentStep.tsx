import { Select } from "../../../components/atoms/Select";
import { TextField } from "../../../components/atoms/TextField";
import { Chip } from "../../../components/atoms/Chip";
import { Close } from "../../../components/atoms/Icons";
import { useRecurrentStep } from "../hooks/useRecurrentStep";
import type { RecurrentRow } from "../hooks/useRecurrentStep";
import { CADENCE_SECTIONS, sectionFor } from "../helpers/cadenceSections";
import type { CadenceSection } from "../helpers/cadenceSections";
import { paymentMethodOptionLabel } from "../../../helpers/paymentMethodLabel";
import { sortByName } from "../../../helpers/paymentMethodOptions";
import { BACKFILL_MONTHS } from "../../../helpers/scheduleAnchor";
import { ScheduleFields } from "../../../components/molecules/ScheduleFields";
import { CURRENCY_SYMBOL, FREQUENCY_LABELS, SELECTABLE_CURRENCIES } from "../../../constants";
import type { Currency, Frequency } from "../../../types";

const CURRENCY_OPTIONS = SELECTABLE_CURRENCIES.map((c) => ({
  value: c.value,
  label: `${CURRENCY_SYMBOL[c.value]} ${c.label}`,
}));

interface Props {
  state: ReturnType<typeof useRecurrentStep>;
  showPaymentMethod?: boolean;
}

export function RecurrentStep({ state, showPaymentMethod = false }: Props) {
  const { rows, addTo, update, removeAt, categories, methods, backfill, setBackfill } = state;

  const categoryOptions = categories
    .filter((c) => !c.parentId)
    .map((c) => ({ value: c.id!, label: c.name }));

  const methodOptions = sortByName(methods).map((m) => ({
    value: m.id!,
    label: paymentMethodOptionLabel(m),
  }));

  const rowsIn = (section: CadenceSection) =>
    rows.filter((r) => section.frequencies.includes(r.frequency));

  const renderSchedule = (row: RecurrentRow, section: CadenceSection) => {
    const disabled = Boolean(row.id);
    return (
      <>
        {section.id === "other" && (
          <Select
            label="Cadence"
            options={section.frequencies.map((f) => ({ value: f, label: FREQUENCY_LABELS[f] }))}
            value={row.frequency}
            disabled={disabled}
            onValueChange={(v) => update(row.key, { frequency: v as Frequency })}
          />
        )}
        <ScheduleFields
          frequency={row.frequency}
          value={row}
          disabled={disabled}
          onChange={(p) => update(row.key, p)}
        />
      </>
    );
  };

  return (
    <div className="step">
      <label className="backfill">
        <input
          type="checkbox"
          checked={backfill}
          onChange={(e) => setBackfill(e.currentTarget.checked)}
        />
        <span>
          Backfill recurring items for the last {BACKFILL_MONTHS} months
          <span className="backfill-hint">
            {" "}
            — so your charts and totals have history from day one
          </span>
        </span>
      </label>

      {CADENCE_SECTIONS.map((section) => {
        const sectionRows = rowsIn(section);
        return (
          <section key={section.id} className="section">
            <header className="section-head">
              <h3 className="section-title">{section.title}</h3>
              <p className="section-hint">{section.hint}</p>
            </header>

            {sectionRows.map((row) => {
              const disabled = Boolean(row.id);
              return (
                <div key={row.key} className="row">
                  <div className="fields">
                    <div className="field field--category">
                      <Select
                        label="Category"
                        placeholder="Main category"
                        options={categoryOptions}
                        value={row.categoryId}
                        disabled={disabled}
                        onValueChange={(value) => update(row.key, { categoryId: value })}
                      />
                    </div>
                    <div className="field field--name">
                      <TextField
                        label="Name"
                        placeholder="Name"
                        value={row.name}
                        disabled={disabled}
                        onValueChange={(value) => update(row.key, { name: value })}
                      />
                    </div>
                    <div className="field field--amount">
                      <TextField
                        label="Amount"
                        placeholder="0"
                        inputMode="decimal"
                        prefix={CURRENCY_SYMBOL[row.currency]}
                        align="right"
                        value={row.amount}
                        disabled={disabled}
                        onValueChange={(value) =>
                          update(row.key, { amount: value.replace(/[^\d.]/g, "") })
                        }
                      />
                    </div>
                    <div className="field field--currency">
                      <Select
                        label="Currency"
                        options={CURRENCY_OPTIONS}
                        value={row.currency}
                        disabled={disabled}
                        onValueChange={(value) => update(row.key, { currency: value as Currency })}
                      />
                    </div>
                    <div className="field field--schedule">{renderSchedule(row, section)}</div>
                    {showPaymentMethod && (
                      <div className="field field--method">
                        <Select
                          label="Payment method"
                          placeholder="None"
                          options={methodOptions}
                          value={row.paymentMethodId}
                          disabled={disabled}
                          onValueChange={(value) => update(row.key, { paymentMethodId: value })}
                        />
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    className="remove"
                    onClick={() => removeAt(row.key)}
                    aria-label={`Remove ${row.name || "row"}`}
                  >
                    <Close size={20} />
                  </button>
                </div>
              );
            })}

            <div>
              <Chip variant="add" onClick={() => addTo(section.defaultFrequency)}>
                {sectionRows.length ? "Add more" : `Add ${section.title.toLowerCase()}`}
              </Chip>
            </div>
          </section>
        );
      })}

      <style jsx>{`
        .step {
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .backfill {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 14px;
          border: 1px solid var(--glass-rim);
          border-radius: var(--r-md);
          background: var(--glass-inset);
          font-size: 0.875rem;
          color: var(--fg-0);
          cursor: pointer;
        }

        .backfill input {
          margin-top: 2px;
          width: 16px;
          height: 16px;
          accent-color: var(--accent);
          cursor: pointer;
          flex-shrink: 0;
        }

        .backfill-hint {
          color: var(--fg-2);
        }

        .section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .section-head {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .section-title {
          margin: 0;
          font-size: 0.9375rem;
          font-weight: 700;
          color: var(--fg-0);
        }

        .section-hint {
          margin: 0;
          font-size: 0.8125rem;
          color: var(--fg-2);
        }

        .row {
          display: flex;
          align-items: flex-end;
          gap: 12px;
          padding: 14px;
          border: 1px solid var(--glass-rim);
          border-radius: var(--r-md);
          background: var(--glass-inset);
        }

        .fields {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .field {
          flex: 1 1 140px;
          min-width: 0;
        }

        .field--category,
        .field--name {
          flex: 2 1 180px;
        }

        .field--schedule {
          display: flex;
          gap: 12px;
          flex: 1 1 160px;
        }

        .field--schedule > :global(*) {
          flex: 1;
          min-width: 0;
        }

        .remove {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          flex-shrink: 0;
          padding: 0;
          border: none;
          border-radius: var(--r-md);
          background: transparent;
          color: var(--fg-2);
          cursor: pointer;
        }

        .remove:hover {
          color: var(--accent-hot);
          background: var(--glass-hover);
        }

        @media (max-width: 767px) {
          .row {
            align-items: flex-start;
          }

          .field,
          .field--category,
          .field--name,
          .field--schedule {
            flex-basis: 100%;
          }
        }
      `}</style>
    </div>
  );
}
