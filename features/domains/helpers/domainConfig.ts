import type { Domain } from "../../../types";

/**
 * How each domain behaves on its page. The copy lives in `../messages`
 * (`DOMAIN_MESSAGES`, keys ending in the domain) and `messages/common`
 * (`domain.X`); `title` and `spentLabel` are the English forms, kept only for
 * the importers outside this feature that have not moved to the catalogs yet.
 */
interface DomainConfig {
  /** English page title ("Expenses"). Prefer common `domain.X`. */
  title: string;
  /** English month-figure verb ("Spent"). Prefer `DOMAIN_MESSAGES` `spent.X`. */
  spentLabel: string;
  /** CSS token for accents (tabs, chart, card edge). */
  accent: string;
  /** Whether the table shows the payment method column (mockup: expenses only). */
  showPaymentMethod: boolean;
  /** Is a month-over-month increase good news for this domain? */
  upIsGood: boolean;
}

export const DOMAIN_CONFIG: Record<Domain, DomainConfig> = {
  INCOME: {
    title: "Income",
    spentLabel: "Received",
    accent: "var(--domain-income)",
    showPaymentMethod: false,
    upIsGood: true,
  },
  EXPENSE: {
    title: "Expenses",
    spentLabel: "Spent",
    accent: "var(--domain-expense)",
    showPaymentMethod: true,
    upIsGood: false,
  },
  INVESTMENT: {
    title: "Investments",
    spentLabel: "Invested",
    accent: "var(--domain-investment)",
    showPaymentMethod: false,
    upIsGood: true,
  },
  SAVING: {
    title: "Savings",
    spentLabel: "Saved",
    accent: "var(--domain-saving)",
    showPaymentMethod: false,
    upIsGood: true,
  },
  DEBT: {
    title: "Debts",
    spentLabel: "Repaid",
    accent: "var(--domain-debt)",
    showPaymentMethod: true,
    upIsGood: true,
  },
};
