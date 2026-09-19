import type { Currency, Frequency, PaymentMethodType } from "./types";

/**
 * The single source of truth for supported currencies. `Currency` (types),
 * `CurrencySchema` (zod) and the FX API symbol list are all derived from it —
 * adding a currency here propagates everywhere.
 */
export const CURRENCIES = ["USD", "EUR", "MXN", "GBP", "SEK", "CHF", "JPY", "COP"] as const;

/**
 * What the currency pickers offer until the user curates the list in Settings
 * (`users.enabledCurrencies`). The catalog above stays the set of currencies
 * the app *supports* — this is the handful shown by default, so a picker isn't
 * eight options long for someone who only ever uses one or two.
 */
export const DEFAULT_ENABLED_CURRENCIES: Currency[] = ["USD", "EUR", "GBP"];

/** Currencies conventionally written without decimal places. */
export const ZERO_DECIMAL_CURRENCIES: Set<Currency> = new Set(["JPY", "COP"]);

export const CURRENCY_SYMBOL: Record<Currency, string> = {
  USD: "$",
  EUR: "€",
  MXN: "$",
  GBP: "£",
  SEK: "kr",
  CHF: "Fr",
  JPY: "¥",
  COP: "$",
};

/** One colour per currency for stacked "by currency" charts — stable across pages. */
export const CURRENCY_COLORS: Record<Currency, string> = {
  USD: "var(--palette-1)",
  EUR: "var(--palette-2)",
  SEK: "var(--palette-3)",
  COP: "var(--palette-4)",
  GBP: "var(--palette-5)",
  CHF: "var(--palette-6)",
  MXN: "var(--palette-7)",
  JPY: "var(--palette-8)",
};

/**
 * The whole catalog as select options. Only the onboarding main-currency
 * picker uses it: the enabled list doesn't exist yet there, and a new user
 * must be able to pick the currency they actually earn in. Everywhere else
 * goes through `useEnabledCurrencies()`.
 */
export const SELECTABLE_CURRENCIES: { value: Currency; label: string }[] = CURRENCIES.map((c) => ({
  value: c,
  label: c,
}));

export const PAYMENT_METHOD_TYPE_LABELS: Record<PaymentMethodType, string> = {
  CREDIT_CARD: "Credit card",
  DEBIT_CARD: "Debit card",
  BANK_TRANSFER: "Bank transfer",
  DIGITAL_WALLET: "Digital wallet",
  CASH: "Cash",
  CRYPTO_WALLET: "Crypto wallet",
  OTHER: "Other",
};

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  ONE_TIME: "One time",
  WEEKLY: "Weekly",
  BIWEEKLY: "Twice a month",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  YEARLY: "Yearly",
};

/**
 * Curated category icons, keyed by name. `IconKey` (types) and the Zod enum
 * derive from this list; the drawings live in components/atoms/Icons.tsx and
 * the key → component map in components/atoms/CategoryIcon.tsx.
 */
export const ICON_KEYS = [
  "home",
  "family",
  "subscriptions",
  "credit-card",
  "shield",
  "shuffle",
  "briefcase",
  "building",
  "piggy",
  "lifebuoy",
  "coins",
  "chart",
  "bitcoin",
  "landmark",
  "car",
  "cart",
  "utensils",
  "heart",
  "gift",
  "plane",
  "book",
  "zap",
  "phone",
  "tag",
  "wallet",
  "repeat",
] as const;

/** Where the commit of a preview build links to. */
export const GITHUB_REPO_URL = "https://github.com/glrodasz/walleto";

/**
 * How many months a chart can look back over. One list for every chart: the
 * domain pages and the dashboard's cash flow offer the same choice.
 */
export const MONTH_PERIODS = [3, 6, 12] as const;
export type MonthPeriod = (typeof MONTH_PERIODS)[number];
export const DEFAULT_MONTH_PERIOD: MonthPeriod = 6;

/**
 * A stored period, for `useLocalPreference`. A browser that saved a period
 * from before this list changed (7) holds a number nothing offers any more,
 * and a `<select>` with no matching option silently shows the first one — so
 * anything off the list falls back to the default instead.
 */
export function parseMonthPeriod(raw: string): MonthPeriod {
  const n = Number(JSON.parse(raw));
  return (MONTH_PERIODS as readonly number[]).includes(n)
    ? (n as MonthPeriod)
    : DEFAULT_MONTH_PERIOD;
}
