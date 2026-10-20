import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { RecurringChecklist } from "./RecurringChecklist";
import { column } from "../../../stories/decorators";
import {
  categoriesFor,
  CURRENT_WINDOW,
  NOW,
  recurrentFor,
  STORY_CTX,
  STORY_PAYMENT_METHODS,
  STORY_TAGS,
  STORY_WINDOWS,
  transactionsFor,
  ts,
} from "../../../stories/fixtures";
import type { Transaction } from "../../../types";

const meta = {
  title: "Organisms/Domains/RecurringChecklist",
  component: RecurringChecklist,
  tags: ["autodocs"],
  args: {
    domain: "EXPENSE",
    items: recurrentFor("EXPENSE"),
    transactions: transactionsFor("EXPENSE"),
    paymentMethods: STORY_PAYMENT_METHODS,
    categories: categoriesFor("EXPENSE"),
    tags: STORY_TAGS,
    ctx: STORY_CTX,
    currency: "USD",
    window: CURRENT_WINDOW,
    now: NOW,
    onMarkPaid: fn(),
    onEdit: fn(),
    onStop: fn(),
    onToggleHidden: fn(),
    busyId: null,
  },
  decorators: [column],
} satisfies Meta<typeof RecurringChecklist>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every planned charge this month: paid, due or overdue, with the run rate on top. */
export const Expenses: Story = {};
export const Incomes: Story = {
  args: {
    domain: "INCOME",
    items: recurrentFor("INCOME"),
    transactions: transactionsFor("INCOME"),
    categories: categoriesFor("INCOME"),
  },
};
export const Busy: Story = { args: { busyId: "rt-netflix" } };
export const Loading: Story = { args: { loading: true } };
export const Empty: Story = { args: { items: [], transactions: [] } };

const LAST_MONTH = STORY_WINDOWS[STORY_WINDOWS.length - 2];
const inLastMonth = (t: Transaction) => {
  const at = t.occurredAt.toDate();
  return at >= LAST_MONTH.start && at < LAST_MONTH.end;
};
const lastMonthRows = transactionsFor("EXPENSE").filter(inLastMonth);

/**
 * Last month, where the ledger strayed from the plan. Each row still reads as
 * the plan — today's price, the scheduled day — and only what differs shows:
 * Rent went up 10% after it was paid (the pill keeps the 1,650 paid), Netflix
 * was paid two days late, and Spotify's payment was removed from Activity, so
 * it reads as skipped instead of overdue.
 */
export const PaidDiffersFromPlan: Story = {
  args: {
    window: LAST_MONTH,
    items: recurrentFor("EXPENSE").map((i) => (i.id === "rt-rent" ? { ...i, amount: 1815 } : i)),
    transactions: lastMonthRows
      .filter((t) => t.recurrentTransactionId !== "rt-spotify")
      .map((t) => {
        if (t.recurrentTransactionId !== "rt-netflix") return t;
        const at = t.occurredAt.toDate();
        return {
          ...t,
          occurredAt: ts(new Date(at.getFullYear(), at.getMonth(), at.getDate() + 2, 9)),
        };
      }),
    skipped: lastMonthRows
      .filter((t) => t.recurrentTransactionId === "rt-spotify")
      .map((t) => ({ ...t, status: "SKIPPED" as const })),
  },
};

const nextMonthDay = (t: Transaction) => {
  const at = t.occurredAt.toDate();
  return ts(new Date(at.getFullYear(), at.getMonth() + 1, 1, 9));
};

/**
 * Last month, with payments re-dated into this month in Activity: Netflix
 * still reads as paid in its own month (with the day it moved to), and
 * Spotify, moved and then removed, reads as skipped — not overdue.
 */
export const PaymentMovedToNextMonth: Story = {
  args: {
    window: LAST_MONTH,
    transactions: transactionsFor("EXPENSE")
      .filter((t) => !(inLastMonth(t) && t.recurrentTransactionId === "rt-spotify"))
      .map((t) =>
        inLastMonth(t) && t.recurrentTransactionId === "rt-netflix"
          ? { ...t, occurredAt: nextMonthDay(t) }
          : t
      ),
    skipped: lastMonthRows
      .filter((t) => t.recurrentTransactionId === "rt-spotify")
      .map((t) => ({ ...t, occurredAt: nextMonthDay(t), status: "SKIPPED" as const })),
  },
};
