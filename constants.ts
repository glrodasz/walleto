import type { Currency, Frequency, PaymentMethodType } from "./types";

/**
 * The single source of truth for supported currencies. `Currency` (types),
 * `CurrencySchema` (zod) and the FX API symbol list are all derived from it —
 * adding a currency here propagates everywhere.
 */
export const CURRENCIES = ["USD", "EUR", "MXN", "GBP", "SEK", "CHF", "JPY", "COP"] as const;

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

/** Currencies offered during onboarding, in display order. */
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
