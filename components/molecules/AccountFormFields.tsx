import { Select } from "../atoms/Select";
import { TextField } from "../atoms/TextField";
import { useEnabledCurrencies } from "../../hooks/useEnabledCurrencies";
import { useDecimalInput } from "../../hooks/useDecimalInput";
import type { AccountDraft } from "../../helpers/accountDraft";
import type { AccountDomain, Currency, InterestPeriod } from "../../types";

interface Props {
  domain: AccountDomain;
  draft: AccountDraft;
  onChange: (draft: AccountDraft) => void;
  autoFocus?: boolean;
}

const PERIOD_OPTIONS: { value: InterestPeriod; label: string }[] = [
  { value: "YEARLY", label: "Yearly" },
  { value: "MONTHLY", label: "Monthly" },
];

const NAME_PLACEHOLDER: Record<AccountDomain, string> = {
  INVESTMENT: "Broker account",
  SAVING: "Emergency fund",
  DEBT: "Credit card",
};

/**
 * The fields of an account / pocket / debt — name, bank or broker (the lender,
 * for a debt), currency and the interest rate as the bank quotes it. Creating
 * and editing render this same piece, so both forms look alike.
 */
export function AccountFormFields({ domain, draft, onChange, autoFocus }: Props) {
  const { optionsFor } = useEnabledCurrencies();
  const { sanitize } = useDecimalInput();
  const set = (patch: Partial<AccountDraft>) => onChange({ ...draft, ...patch });

  return (
    <div className="fields">
      <div className="pair">
        <TextField
          label="Name"
          placeholder={NAME_PLACEHOLDER[domain]}
          autoFocus={autoFocus}
          value={draft.name}
          onValueChange={(v) => set({ name: v })}
        />
        <TextField
          label={domain === "DEBT" ? "Lender" : "Bank or broker"}
          placeholder="Optional"
          value={draft.provider}
          onValueChange={(v) => set({ provider: v })}
        />
      </div>
      <div className="pair">
        <Select
          label="Currency"
          options={optionsFor(draft.currency)}
          value={draft.currency}
          onValueChange={(v) => set({ currency: v as Currency })}
        />
        <div className="pair">
          <TextField
            label="Interest rate %"
            placeholder="None"
            inputMode="decimal"
            align="right"
            value={draft.rate}
            onValueChange={(v) => set({ rate: sanitize(v) })}
          />
          <Select
            label="Period"
            options={PERIOD_OPTIONS}
            value={draft.period}
            onValueChange={(v) => set({ period: v as InterestPeriod })}
          />
        </div>
      </div>

      <style jsx>{`
        .fields {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .pair {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        @media (max-width: 480px) {
          .pair {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
