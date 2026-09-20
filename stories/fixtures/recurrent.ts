import { nextOccurrenceFrom } from "../../helpers/recurrence";
import type { Domain, RecurrentTransaction } from "../../types";
import { monthsAgo, NOW, ts, STORY_USER_ID } from "./time";

type Seed = Omit<RecurrentTransaction, "userId" | "startDate" | "nextOccurrence" | "active"> & {
  /** Day of month the item started, 8 months ago. */
  day: number;
  active?: boolean;
};

function item(seed: Seed): RecurrentTransaction {
  const { day, active = true, ...rest } = seed;
  const startDate = monthsAgo(8, day);
  const next = nextOccurrenceFrom(startDate, rest.frequency, NOW, {
    secondDayOfMonth: rest.secondDayOfMonth,
  });
  return {
    userId: STORY_USER_ID,
    ...rest,
    startDate: ts(startDate),
    ...(next ? { nextOccurrence: ts(next) } : {}),
    active,
    createdAt: ts(startDate),
  };
}

/** The plan: what repeats every month, across the five domains and three currencies. */
export const STORY_RECURRENT: RecurrentTransaction[] = [
  // ── Income ──────────────────────────────────────────────
  item({
    id: "rt-salary",
    domain: "INCOME",
    categoryId: "cat-income-salary",
    name: "Base salary",
    amount: 4800,
    currency: "USD",
    frequency: "MONTHLY",
    type: "SALARY",
    paymentMethodId: "pm-wise",
    day: 25,
  }),
  item({
    id: "rt-retainer",
    domain: "INCOME",
    categoryId: "cat-income-side",
    name: "Design retainer",
    amount: 900,
    currency: "EUR",
    frequency: "MONTHLY",
    type: "OTHER",
    paymentMethodId: "pm-revolut",
    tags: ["tag-work"],
    inheritTags: true,
    day: 5,
  }),
  item({
    id: "rt-rent-income",
    domain: "INCOME",
    categoryId: "cat-income-rent",
    name: "Apartment rent",
    amount: 2400000,
    currency: "COP",
    frequency: "MONTHLY",
    type: "OTHER",
    paymentMethodId: "pm-bancolombia",
    day: 3,
  }),

  // ── Expenses ────────────────────────────────────────────
  item({
    id: "rt-rent",
    domain: "EXPENSE",
    categoryId: "cat-expense-home",
    name: "Rent",
    amount: 1650,
    currency: "USD",
    frequency: "MONTHLY",
    type: "OTHER",
    paymentMethodId: "pm-chase",
    tags: ["tag-family"],
    inheritTags: true,
    day: 1,
  }),
  item({
    id: "rt-netflix",
    domain: "EXPENSE",
    categoryId: "cat-expense-streaming",
    name: "Netflix",
    amount: 15.49,
    currency: "USD",
    frequency: "MONTHLY",
    type: "SUBSCRIPTION",
    paymentMethodId: "pm-chase",
    serviceSnapshot: { serviceId: "netflix", name: "Netflix" },
    day: 12,
  }),
  item({
    id: "rt-spotify",
    domain: "EXPENSE",
    categoryId: "cat-expense-subs",
    name: "Spotify Family",
    amount: 17.99,
    currency: "EUR",
    frequency: "MONTHLY",
    type: "SUBSCRIPTION",
    paymentMethodId: "pm-revolut",
    tags: ["tag-family", "tag-shared"],
    inheritTags: true,
    day: 18,
  }),
  item({
    id: "rt-icloud",
    domain: "EXPENSE",
    categoryId: "cat-expense-subs",
    name: "iCloud+",
    amount: 2.99,
    currency: "USD",
    frequency: "MONTHLY",
    type: "SUBSCRIPTION",
    paymentMethodId: "pm-chase",
    day: 9,
  }),
  item({
    id: "rt-car-insurance",
    domain: "EXPENSE",
    categoryId: "cat-expense-insurance",
    name: "Car insurance",
    amount: 1440,
    currency: "USD",
    frequency: "YEARLY",
    type: "OTHER",
    paymentMethodId: "pm-chase",
    spreadMonthly: true,
    day: 14,
  }),
  item({
    id: "rt-groceries",
    domain: "EXPENSE",
    categoryId: "cat-expense-groceries",
    name: "Groceries",
    amount: 900000,
    currency: "COP",
    chargedAmount: 900000,
    chargedCurrency: "COP",
    frequency: "BIWEEKLY",
    secondDayOfMonth: 20,
    type: "OTHER",
    paymentMethodId: "pm-bancolombia",
    day: 6,
  }),
  item({
    id: "rt-loan",
    domain: "EXPENSE",
    categoryId: "cat-expense-credits",
    name: "Car loan",
    amount: 320,
    currency: "USD",
    frequency: "MONTHLY",
    type: "LOAN_PAYMENT",
    paymentMethodId: "pm-chase",
    note: "Ends next spring",
    inheritNote: true,
    day: 15,
  }),
  item({
    id: "rt-gym",
    domain: "EXPENSE",
    categoryId: "cat-expense-variable",
    name: "Gym",
    amount: 45,
    currency: "USD",
    frequency: "MONTHLY",
    type: "SUBSCRIPTION",
    paymentMethodId: "pm-nu",
    hiddenFromDashboard: true,
    day: 2,
  }),

  // ── Investments ─────────────────────────────────────────
  item({
    id: "rt-index-fund",
    domain: "INVESTMENT",
    categoryId: "cat-investment-banking",
    accountId: "acc-avanza",
    name: "Global index fund",
    amount: 5000,
    currency: "SEK",
    frequency: "MONTHLY",
    type: "OTHER",
    paymentMethodId: "pm-revolut",
    day: 27,
  }),
  item({
    id: "rt-btc",
    domain: "INVESTMENT",
    categoryId: "cat-investment-crypto",
    accountId: "acc-coinbase",
    name: "Bitcoin DCA",
    amount: 150,
    currency: "USD",
    frequency: "MONTHLY",
    type: "OTHER",
    paymentMethodId: "pm-wise",
    day: 10,
  }),

  // ── Savings ─────────────────────────────────────────────
  item({
    id: "rt-emergency",
    domain: "SAVING",
    categoryId: "cat-saving-emergency",
    accountId: "acc-emergency",
    name: "Emergency fund top-up",
    amount: 400,
    currency: "USD",
    frequency: "MONTHLY",
    type: "SAVINGS_TRANSFER",
    paymentMethodId: "pm-wise",
    day: 26,
  }),
  item({
    id: "rt-trip",
    domain: "SAVING",
    categoryId: "cat-saving-banking",
    accountId: "acc-trip",
    name: "Japan trip pocket",
    amount: 200,
    currency: "EUR",
    frequency: "MONTHLY",
    type: "SAVINGS_TRANSFER",
    paymentMethodId: "pm-revolut",
    tags: ["tag-trip"],
    inheritTags: true,
    day: 26,
  }),

  // ── Debts ───────────────────────────────────────────────
  item({
    id: "rt-visa",
    domain: "DEBT",
    categoryId: "cat-debt-cards",
    accountId: "acc-visa",
    name: "Visa Gold payment",
    amount: 250,
    currency: "USD",
    frequency: "MONTHLY",
    type: "LOAN_PAYMENT",
    paymentMethodId: "pm-wise",
    day: 5,
  }),
  item({
    id: "rt-mortgage",
    domain: "DEBT",
    categoryId: "cat-debt-mortgage",
    accountId: "acc-mortgage",
    name: "Mortgage instalment",
    amount: 9800,
    currency: "SEK",
    frequency: "MONTHLY",
    type: "LOAN_PAYMENT",
    paymentMethodId: "pm-wise",
    day: 27,
  }),
];

export function recurrentFor(domain?: Domain): RecurrentTransaction[] {
  return domain ? STORY_RECURRENT.filter((r) => r.domain === domain) : STORY_RECURRENT;
}

export const recurrentById = (id: string) => STORY_RECURRENT.find((r) => r.id === id);

/** The five soonest charges, the dashboard's "Upcoming payments". */
export function upcomingItems(count = 5): RecurrentTransaction[] {
  return STORY_RECURRENT.filter(
    (r) => r.domain === "EXPENSE" && r.nextOccurrence && !r.hiddenFromDashboard
  )
    .sort((a, b) => a.nextOccurrence!.seconds - b.nextOccurrence!.seconds)
    .slice(0, count);
}
