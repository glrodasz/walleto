import { formatNumber } from "./money";
import type { DecimalSeparator } from "../utils/decimal";
import type { AccountDomain, Domain, InterestRate, TransactionDirection } from "../types";

/** How the UI names an account in each domain that has them. */
export const ACCOUNT_NOUN: Record<AccountDomain, { singular: string; article: string }> = {
  INVESTMENT: { singular: "account", article: "an investment account" },
  SAVING: { singular: "pocket", article: "a savings pocket" },
  DEBT: { singular: "debt", article: "a debt" },
};

/**
 * Investments and savings sit somewhere, and a debt is owed to someone;
 * incomes and expenses have payment methods instead.
 */
export function isAccountDomain(domain: Domain): domain is AccountDomain {
  return domain === "INVESTMENT" || domain === "SAVING" || domain === "DEBT";
}

/** "2.5% yearly" / "0.4% monthly", for pills and rows, in the user's separator. */
export function formatInterestRate(rate: InterestRate, separator: DecimalSeparator = "."): string {
  const value = formatNumber(rate.value, { maxDecimals: 2, separator });
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

/** What a one-off row's direction is called on this kind of account. */
export function directionLabel(domain: AccountDomain, direction: TransactionDirection): string {
  if (domain === "DEBT") return direction === "OUT" ? "Borrowed" : "Repayment";
  return direction === "OUT" ? "Withdrawal" : "Deposit";
}
