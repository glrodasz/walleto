import { useEffect, useState } from "react";
import { Card } from "../../../components/atoms/Card";
import { CheckboxField } from "../../../components/atoms/CheckboxField";
import { SectionTitle } from "../../../components/atoms/SectionTitle";
import { Select } from "../../../components/atoms/Select";
import { TextField } from "../../../components/atoms/TextField";
import { useDecimalInput } from "../../../hooks/useDecimalInput";
import { useEnabledCurrencies } from "../../../hooks/useEnabledCurrencies";
import { useMoneyFormat } from "../../../hooks/useMoneyFormat";
import { CURRENCY_SYMBOL } from "../../../constants";
import type { Currency, EmergencyPlan } from "../../../types";

interface Props {
  plan: EmergencyPlan;
  onSave: (patch: Partial<EmergencyPlan>) => void;
  /** Today's investments, in `currency` — shown on the toggle that counts them. */
  investments: number;
  currency: Currency;
  error?: string | null;
}

const MAX_MONTHS = 60;

/**
 * A typed number that saves on blur. It keeps the owner's own text while they
 * type, and only follows the stored value when that changes from elsewhere.
 */
function useCommittedNumber(value: number, commit: (n: number) => void, integer = false) {
  const decimal = useDecimalInput();
  const [text, setText] = useState(() => decimal.toPrefill(value));

  useEffect(() => {
    if ((decimal.parse(text) ?? 0) !== value) setText(decimal.toPrefill(value));
    // Only an outside change of the stored value re-seeds the field.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return {
    value: text,
    onValueChange: (raw: string) => setText(decimal.sanitize(raw)),
    onBlur: () => {
      const parsed = Math.max(0, decimal.parse(text) ?? 0);
      const next = integer ? Math.min(MAX_MONTHS, Math.round(parsed)) : parsed;
      setText(decimal.toPrefill(next));
      if (next !== value) commit(next);
    },
  };
}

/**
 * What still comes in when the regular income stops: an unemployment benefit
 * for a number of months and a one-off severance — plus whether investments
 * count as cash. Saved on the user doc, so the runway reads the same next time.
 */
export function EmergencyPanel({ plan, onSave, investments, currency, error }: Props) {
  const { optionsFor } = useEnabledCurrencies();
  const { formatAmount } = useMoneyFormat();
  const benefit = useCommittedNumber(plan.benefitMonthly, (n) => onSave({ benefitMonthly: n }));
  const months = useCommittedNumber(plan.benefitMonths, (n) => onSave({ benefitMonths: n }), true);
  const severance = useCommittedNumber(plan.severance, (n) => onSave({ severance: n }));
  const symbol = CURRENCY_SYMBOL[plan.currency];

  return (
    <Card>
      <SectionTitle title="Emergency income" />
      <p className="hint">
        If your regular income stops, what would still come in? Unemployment insurance, a severance
        package — leave them empty if there&rsquo;s none.
      </p>

      <div className="fields">
        <TextField
          label="Benefit per month"
          placeholder="0"
          inputMode="decimal"
          prefix={symbol}
          align="right"
          {...benefit}
        />
        <TextField
          label="For how many months"
          hint={`Up to ${MAX_MONTHS}. The benefit stops after this; the runway keeps counting.`}
          placeholder="0"
          inputMode="numeric"
          align="right"
          {...months}
        />
        <TextField
          label="Severance (one-off)"
          placeholder="0"
          inputMode="decimal"
          prefix={symbol}
          align="right"
          {...severance}
        />
        <Select
          label="Currency"
          options={optionsFor(plan.currency)}
          value={plan.currency}
          onValueChange={(v) => onSave({ currency: v as Currency })}
        />
      </div>

      <div className="toggle">
        <CheckboxField
          label="Also count my investments as cash"
          hint={`${formatAmount(investments, currency)} today, if sold.`}
          checked={plan.includeInvestments}
          onChange={(includeInvestments) => onSave({ includeInvestments })}
        />
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <style jsx>{`
        .hint {
          margin: 0 0 14px;
          font-size: 0.85rem;
          color: var(--fg-1);
          line-height: 1.45;
        }

        .fields {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .toggle {
          margin-top: 14px;
        }

        .error {
          margin: 12px 0 0;
          font-size: 0.8rem;
          color: var(--accent-hot);
        }

        @media (max-width: 520px) {
          .fields {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </Card>
  );
}
