import type { Domain } from "../../../types";

interface DomainConfig {
  /** Page title and nav label ("Expenses"). */
  title: string;
  /** One line under the title saying what the page is for. */
  subtitle: string;
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
  /** The one-off entry: the create option's title and the name placeholder. */
  oneOff: { title: string; placeholder: string };
}

export const DOMAIN_CONFIG: Record<Domain, DomainConfig> = {
  INCOME: {
    title: "Income",
    subtitle: "What you expect to earn each month, and what actually arrived.",
    noun: "income",
    spentLabel: "Received",
    runRateLabel: "Planned monthly income",
    accent: "var(--domain-income)",
    showPaymentMethod: false,
    upIsGood: true,
    oneOff: { title: "Log a one-off income", placeholder: "Freelance invoice" },
  },
  EXPENSE: {
    title: "Expenses",
    subtitle: "Your spending plan, and how this month is tracking against it.",
    noun: "expenses",
    spentLabel: "Spent",
    runRateLabel: "Planned monthly expenses",
    accent: "var(--domain-expense)",
    showPaymentMethod: true,
    upIsGood: false,
    oneOff: { title: "Log a one-off expense", placeholder: "Groceries" },
  },
  INVESTMENT: {
    title: "Investments",
    subtitle: "What you plan to invest, what went in, and what it is worth today.",
    noun: "investments",
    spentLabel: "Invested",
    runRateLabel: "Planned monthly investments",
    accent: "var(--domain-investment)",
    showPaymentMethod: false,
    upIsGood: true,
    oneOff: { title: "Log a one-off contribution", placeholder: "Index fund buy" },
  },
  SAVING: {
    title: "Savings",
    subtitle: "What you plan to set aside, and what your pockets hold today.",
    noun: "savings",
    spentLabel: "Saved",
    runRateLabel: "Planned monthly savings",
    accent: "var(--domain-saving)",
    showPaymentMethod: false,
    upIsGood: true,
    oneOff: { title: "Log a one-off deposit", placeholder: "Emergency fund" },
  },
  DEBT: {
    title: "Debts",
    subtitle: "What you owe today, and your plan to pay it down.",
    noun: "repayments",
    spentLabel: "Repaid",
    runRateLabel: "Planned monthly repayments",
    accent: "var(--domain-debt)",
    showPaymentMethod: true,
    upIsGood: true,
    oneOff: { title: "Log a one-off repayment", placeholder: "Credit card payment" },
  },
};
