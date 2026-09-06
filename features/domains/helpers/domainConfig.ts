import type { Domain } from "../../../types";

interface DomainConfig {
  /** Page title and nav label ("Expenses"). */
  title: string;
  /** Lowercase noun for inline copy ("expenses by Housing: $X"). */
  noun: string;
  /** KPI label ("Total expenses"). */
  totalLabel: string;
  /** Run-rate line label ("Planned monthly expenses"). */
  runRateLabel: string;
  /** Caption of the running-total chart ("Spent so far"). */
  soFarLabel: string;
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
    totalLabel: "Total incomes",
    runRateLabel: "Planned monthly income",
    soFarLabel: "Received so far",
    accent: "var(--domain-income)",
    showPaymentMethod: false,
    upIsGood: true,
  },
  EXPENSE: {
    title: "Expenses",
    noun: "expenses",
    totalLabel: "Total expenses",
    runRateLabel: "Planned monthly expenses",
    soFarLabel: "Spent so far",
    accent: "var(--domain-expense)",
    showPaymentMethod: true,
    upIsGood: false,
  },
  INVESTMENT: {
    title: "Investments",
    noun: "investments",
    totalLabel: "Total investments",
    runRateLabel: "Planned monthly investments",
    soFarLabel: "Invested so far",
    accent: "var(--domain-investment)",
    showPaymentMethod: false,
    upIsGood: true,
  },
  SAVING: {
    title: "Savings",
    noun: "savings",
    totalLabel: "Total savings",
    runRateLabel: "Planned monthly savings",
    soFarLabel: "Saved so far",
    accent: "var(--domain-saving)",
    showPaymentMethod: false,
    upIsGood: true,
  },
};
