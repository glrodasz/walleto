import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { StatCard } from "./StatCard";
import { boxed } from "../../stories/decorators";

const meta = {
  title: "Molecules/StatCard",
  component: StatCard,
  tags: ["autodocs"],
  args: {
    title: "Expenses",
    amount: 3184.72,
    currency: "USD",
    domain: "EXPENSE",
    href: "/expenses",
    rows: [
      { name: "Home & Family", value: "52%" },
      { name: "Variable", value: "20%" },
    ],
    categoryCount: 6,
    byCurrency: [
      { currency: "USD", pct: 71 },
      { currency: "COP", pct: 22 },
      { currency: "EUR", pct: 7 },
    ],
    actions: [{ label: "Open Expenses", onSelect: fn() }],
  },
  decorators: [boxed(300)],
} satisfies Meta<typeof StatCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Expenses: Story = {};
export const Income: Story = {
  args: {
    title: "Income",
    domain: "INCOME",
    href: "/incomes",
    amount: 6313.4,
    rows: [
      { name: "Salary", value: "$4,800.00" },
      { name: "Side projects", value: "$978.26" },
    ],
    categoryCount: 3,
    byCurrency: [
      { currency: "USD", pct: 76 },
      { currency: "EUR", pct: 15 },
      { currency: "COP", pct: 9 },
    ],
  },
};
export const Debts: Story = {
  args: {
    title: "Debts",
    domain: "DEBT",
    href: "/debts",
    amount: 1180.5,
    byCurrency: [
      { currency: "SEK", pct: 79 },
      { currency: "USD", pct: 21 },
    ],
    rows: [
      { name: "Mortgage", value: "79%" },
      { name: "Credit cards", value: "21%" },
    ],
    categoryCount: 2,
  },
};
export const SingleCurrency: Story = {
  args: {
    title: "Savings",
    domain: "SAVING",
    href: "/savings",
    amount: 617.39,
    byCurrency: [{ currency: "USD", pct: 100 }],
    rows: [{ name: "Emergency fund", value: "65%" }],
    categoryCount: 2,
  },
};
export const Minimal: Story = {
  args: {
    title: "Investments",
    domain: "INVESTMENT",
    href: "/investments",
    amount: 621.7,
    rows: undefined,
    categoryCount: undefined,
    byCurrency: undefined,
    actions: undefined,
  },
};

/**
 * Investments and savings carry a second figure: the run-rate above is a plan,
 * the caption below is what the accounts actually hold.
 */
export const WithSecondary: Story = {
  args: {
    title: "Investments",
    domain: "INVESTMENT",
    href: "/investments",
    amount: 621.7,
    secondary: (
      <span style={{ fontSize: "0.72rem", color: "var(--fg-2)" }}>
        Worth $312,400.00 · checked Sep 12
      </span>
    ),
  },
};

/** The dashboard's four-up row. */
export const Row: Story = {
  decorators: [boxed(1200)],
  render: (args) => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 16 }}>
      <StatCard
        {...Income.args!}
        title="Income"
        amount={6313.4}
        currency="USD"
        domain="INCOME"
        href="/incomes"
      />
      <StatCard {...args} />
      <StatCard
        {...Minimal.args!}
        title="Investments"
        amount={621.7}
        currency="USD"
        domain="INVESTMENT"
        href="/investments"
      />
      <StatCard
        {...SingleCurrency.args!}
        title="Savings"
        amount={617.39}
        currency="USD"
        domain="SAVING"
        href="/savings"
      />
    </div>
  ),
};
