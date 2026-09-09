import type { AccountDomain, Domain, InterestRate } from "../types";

/** How the UI names an account in each domain that has them. */
export const ACCOUNT_NOUN: Record<AccountDomain, { singular: string; article: string }> = {
  INVESTMENT: { singular: "account", article: "an investment account" },
  SAVING: { singular: "pocket", article: "a savings pocket" },
};

/** Only investments and savings sit somewhere; incomes and expenses have payment methods. */
export function isAccountDomain(domain: Domain): domain is AccountDomain {
  return domain === "INVESTMENT" || domain === "SAVING";
}

/** "2.5% yearly" / "0.4% monthly", for pills and rows. */
export function formatInterestRate(rate: InterestRate): string {
  const value = String(Number(rate.value.toFixed(2)));
  return `${value}% ${rate.period === "YEARLY" ? "yearly" : "monthly"}`;
}

/** "Avanza - ISK" when the account names its bank or broker, the bare name otherwise. */
export function accountLabel(account: { name: string; provider?: string }): string {
  return account.provider ? `${account.provider} - ${account.name}` : account.name;
}

/** By label, locale-aware and case-insensitive; returns a new array. */
export function sortAccountsByLabel<T extends { name: string; provider?: string }>(
  accounts: T[]
): T[] {
  return [...accounts].sort((a, b) =>
    accountLabel(a).localeCompare(accountLabel(b), undefined, { sensitivity: "base" })
  );
}
