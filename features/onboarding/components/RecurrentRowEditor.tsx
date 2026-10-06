import { Select } from "../../../components/atoms/Select";
import { TextField } from "../../../components/atoms/TextField";
import { ScheduleFields } from "../../../components/molecules/ScheduleFields";
import { EditorFooter } from "../../../components/molecules/EditorFooter";
import { CURRENCY_SYMBOL, FREQUENCY_LABELS } from "../../../constants";
import { useEnabledCurrencies } from "../../../hooks/useEnabledCurrencies";
import { useDecimalInput } from "../../../hooks/useDecimalInput";
import type { CadenceSection } from "../helpers/cadenceSections";
import type { RecurrentRow } from "../hooks/useRecurrentStep";
import type { Currency, Frequency } from "../../../types";

interface Option {
  value: string;
  label: string;
}

interface Props {
  row: RecurrentRow;
  section: CadenceSection;
  categoryOptions: Option[];
  /** Absent: no payment method column (income). */
  methodOptions?: Option[];
  onChange: (patch: Partial<RecurrentRow>) => void;
  onRemove: () => void;
}

/**
 * One plan item on the Income / Expenses step. Saved rows stay editable —
 * `save()` patches what changed — and only keep their cadence section: moving
 * a row out of it would make it a different kind of item.
 */
export function RecurrentRowEditor({
  row,
  section,
  categoryOptions,
  methodOptions,
  onChange,
  onRemove,
}: Props) {
  const { optionsFor } = useEnabledCurrencies();
  const { sanitize } = useDecimalInput();

  return (
    <div className="row">
      <div className="fields">
        <div className="field field--category">
          <Select
            label="Category"
            placeholder="Main category"
            options={categoryOptions}
            value={row.categoryId}
            onValueChange={(value) => onChange({ categoryId: value })}
          />
        </div>
        <div className="field field--name">
          <TextField
            label="Name"
            placeholder="Name"
            value={row.name}
            onValueChange={(value) => onChange({ name: value })}
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
            onValueChange={(value) => onChange({ amount: sanitize(value) })}
          />
        </div>
        <div className="field field--currency">
          <Select
            label="Currency"
            options={optionsFor(row.currency)}
            value={row.currency}
            onValueChange={(value) => onChange({ currency: value as Currency })}
          />
        </div>
        <div className="field field--schedule">
          {section.id === "other" && (
            <Select
              label="Cadence"
              options={section.frequencies.map((f) => ({ value: f, label: FREQUENCY_LABELS[f] }))}
              value={row.frequency}
              onValueChange={(v) => onChange({ frequency: v as Frequency })}
            />
          )}
          <ScheduleFields frequency={row.frequency} value={row} onChange={onChange} />
        </div>
        {methodOptions && (
          <div className="field field--method">
            <Select
              label="Payment method"
              placeholder="None"
              options={methodOptions}
              value={row.paymentMethodId}
              onValueChange={(value) => onChange({ paymentMethodId: value })}
            />
          </div>
        )}
      </div>

      {/* Always open, so there's nothing for a "Done" to close. */}
      <EditorFooter onRemove={onRemove} removeLabel={`Remove ${row.name || "row"}`} />

      <style jsx>{`
        /* A card set into the panel's inset: one step darker, so one row reads
           apart from the next. The fields span its full width; Remove waits
           in the footer below them. */
        .row {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 14px;
          border: 1px solid var(--glass-rim);
          border-radius: var(--r-md);
          background: var(--glass-sunken);
        }

        .fields {
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

        @media (max-width: 767px) {
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
