import type { Account, Currency, InterestPeriod, InterestRate } from "../types";

/** What the account form holds while typing: create and edit share it. */
export interface AccountDraft {
  name: string;
  provider: string;
  currency: Currency;
  rate: string;
  period: InterestPeriod;
}

/** The form's values, read and validated: empty optionals come back as `null`. */
export interface AccountDraftValues {
  name: string;
  provider: string | null;
  currency: Currency;
  interestRate: InterestRate | null;
}

export const emptyAccountDraft = (currency: Currency): AccountDraft => ({
  name: "",
  provider: "",
  currency,
  rate: "",
  period: "YEARLY",
});

export const accountDraftOf = (a: Account, toInput: (n: number) => string): AccountDraft => ({
  name: a.name,
  provider: a.provider ?? "",
  currency: a.currency,
  rate: a.interestRate ? toInput(a.interestRate.value) : "",
  period: a.interestRate?.period ?? "YEARLY",
});

/**
 * Validates a draft: the name is required and the rate, when typed, is a
 * percentage between 0 and 100. `noun` names the thing in the error.
 */
export function readAccountDraft(
  draft: AccountDraft,
  parse: (raw: string) => number | null,
  noun: string
): { error: string } | { values: AccountDraftValues } {
  const name = draft.name.trim();
  if (!name) return { error: `Give the ${noun} a name` };
  const rate = draft.rate.trim() === "" ? null : (parse(draft.rate) ?? NaN);
  if (rate !== null && !(rate >= 0 && rate <= 100)) {
    return { error: "Interest rate must be between 0 and 100" };
  }
  return {
    values: {
      name,
      provider: draft.provider.trim() || null,
      currency: draft.currency,
      interestRate: rate === null ? null : { value: rate, period: draft.period },
    },
  };
}
