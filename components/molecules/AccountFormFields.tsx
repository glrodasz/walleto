import { CheckboxField } from "../atoms/CheckboxField";
import { Select } from "../atoms/Select";
import { TextField } from "../atoms/TextField";
import { useEnabledCurrencies } from "../../hooks/useEnabledCurrencies";
import { useDecimalInput } from "../../hooks/useDecimalInput";
import { useT } from "../../hooks/useT";
import { COMMON_MESSAGES } from "../../messages/common";
import { FIELD_MESSAGES } from "../../messages/fields";
import type { AccountDraft } from "../../helpers/accountDraft";
import type { AccountDomain, Currency, InterestPeriod } from "../../types";

interface Props {
  domain: AccountDomain;
  draft: AccountDraft;
  onChange: (draft: AccountDraft) => void;
  autoFocus?: boolean;
}

const PERIODS: InterestPeriod[] = ["YEARLY", "MONTHLY"];

/**
 * The fields of an account / pocket / debt — name, bank or broker (the lender,
 * for a debt), currency and the interest rate as the bank quotes it — plus,
 * for an investment, whether emergency mode may sell it. Creating
 * and editing render this same piece, so both forms look alike.
 */
export function AccountFormFields({ domain, draft, onChange, autoFocus }: Props) {
  const { optionsFor } = useEnabledCurrencies();
  const { sanitize } = useDecimalInput();
  const t = useT(FIELD_MESSAGES);
  const tc = useT(COMMON_MESSAGES);
  const set = (patch: Partial<AccountDraft>) => onChange({ ...draft, ...patch });

  return (
    <div className="fields">
      <div className="pair">
        <TextField
          label={tc("noun.name")}
          placeholder={t(`account.placeholder.${domain}`)}
          autoFocus={autoFocus}
          value={draft.name}
          onValueChange={(v) => set({ name: v })}
        />
        <TextField
          label={domain === "DEBT" ? t("account.lender") : t("account.provider")}
          placeholder={tc("state.optional")}
          value={draft.provider}
          onValueChange={(v) => set({ provider: v })}
        />
      </div>
      <div className="pair">
        <Select
          label={tc("noun.currency")}
          options={optionsFor(draft.currency)}
          value={draft.currency}
          onValueChange={(v) => set({ currency: v as Currency })}
        />
        <div className="pair">
          <TextField
            label={t("account.interestRate")}
            placeholder={tc("state.none")}
            inputMode="decimal"
            align="right"
            value={draft.rate}
            onValueChange={(v) => set({ rate: sanitize(v) })}
          />
          <Select
            label={t("account.period")}
            options={PERIODS.map((p) => ({ value: p, label: t(`account.period.${p}`) }))}
            value={draft.period}
            onValueChange={(v) => set({ period: v as InterestPeriod })}
          />
        </div>
      </div>
      {domain === "INVESTMENT" && (
        <CheckboxField
          label={t("account.emergency")}
          hint={t("account.emergencyHint")}
          checked={draft.emergencyAvailable}
          onChange={(emergencyAvailable) => set({ emergencyAvailable })}
        />
      )}

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
