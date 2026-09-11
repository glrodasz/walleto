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
    title: "Incomes",
    subtitle: "See what comes in, month by month, and where it comes from.",
    noun: "incomes",
    spentLabel: "Received",
    runRateLabel: "Planned monthly income",
    accent: "var(--domain-income)",
    showPaymentMethod: false,
    upIsGood: true,
    oneOff: { title: "Record an income", placeholder: "Freelance invoice" },
  },
  EXPENSE: {
    title: "Expenses",
    subtitle: "Track what you spend, see your patterns, and stay in control.",
    noun: "expenses",
    spentLabel: "Spent",
    runRateLabel: "Planned monthly expenses",
    accent: "var(--domain-expense)",
    showPaymentMethod: true,
    upIsGood: false,
    oneOff: { title: "Record a payment", placeholder: "Groceries" },
  },
  INVESTMENT: {
    title: "Investments",
    subtitle: "Follow what you put aside to grow, and what it is worth.",
    noun: "investments",
    spentLabel: "Invested",
    runRateLabel: "Planned monthly investments",
    accent: "var(--domain-investment)",
    showPaymentMethod: false,
    upIsGood: true,
    oneOff: { title: "Record a contribution", placeholder: "Index fund buy" },
  },
  SAVING: {
    title: "Savings",
    subtitle: "Watch your pockets fill up, one deposit at a time.",
    noun: "savings",
    spentLabel: "Saved",
    runRateLabel: "Planned monthly savings",
    accent: "var(--domain-saving)",
    showPaymentMethod: false,
    upIsGood: true,
    oneOff: { title: "Record a deposit", placeholder: "Emergency fund" },
  },
};
