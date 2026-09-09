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
  const value = Number.isInteger(rate.value) ? String(rate.value) : rate.value.toFixed(2);
  return `${value}% ${rate.period === "YEARLY" ? "yearly" : "monthly"}`;
}

/** Locale-aware, case-insensitive; returns a new array. */
export function sortAccountsByName<T extends { name: string }>(accounts: T[]): T[] {
  return [...accounts].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );
}
