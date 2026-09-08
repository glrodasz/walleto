import type { Domain } from "../../../types";

interface DomainConfig {
  /** Page title and nav label ("Expenses"). */
  title: string;
  /** Lowercase noun for inline copy ("expenses by Housing: $X"). */
  noun: string;
  /** Verb for the month figure ("Spent in September"). */
  spentLabel: string;
  /** Run-rate line label ("Planned monthly expenses"). */
  runRateLabel: string;
  /** CSS token for accents (tabs, chart, card edge). */
  accent: string;
  /** Whether the table shows the payment method column (mockup: expenses only). */
  showPaymentMethod: boolean;
  /** Is a month-over-month increase good news for this domain? */
  upIsGood: boolean;
}

export const DOMAIN_CONFIG: Record<Domain, DomainConfig> = {
  INCOME: {
    title: "Incomes",
    noun: "incomes",
    spentLabel: "Received",
    runRateLabel: "Planned monthly income",
    accent: "var(--domain-income)",
    showPaymentMethod: false,
    upIsGood: true,
  },
  EXPENSE: {
    title: "Expenses",
    noun: "expenses",
    spentLabel: "Spent",
    runRateLabel: "Planned monthly expenses",
    accent: "var(--domain-expense)",
    showPaymentMethod: true,
    upIsGood: false,
  },
  INVESTMENT: {
    title: "Investments",
    noun: "investments",
    spentLabel: "Invested",
    runRateLabel: "Planned monthly investments",
    accent: "var(--domain-investment)",
    showPaymentMethod: false,
    upIsGood: true,
  },
  SAVING: {
    title: "Savings",
    noun: "savings",
    spentLabel: "Saved",
    runRateLabel: "Planned monthly savings",
    accent: "var(--domain-saving)",
    showPaymentMethod: false,
    upIsGood: true,
  },
};
