import { COMMON_MESSAGES } from "../messages/common";
import { LABEL_MESSAGES } from "../messages/labels";
import { translate } from "./i18n";
import type { Language, PaymentMethodType } from "../types";

/** Every method type, in display order. */
export const PAYMENT_METHOD_TYPES: PaymentMethodType[] = [
  "CREDIT_CARD",
  "DEBIT_CARD",
  "BANK_TRANSFER",
  "DIGITAL_WALLET",
  "CASH",
  "CRYPTO_WALLET",
  "OTHER",
];

/** The type picker (wizard step 2, inline creator) in the reader's language. */
export function paymentMethodTypeOptions(
  language: Language = "en"
): { value: PaymentMethodType; label: string }[] {
  return PAYMENT_METHOD_TYPES.map((value) => ({
    value,
    label: translate(COMMON_MESSAGES, language, `methodType.${value}`),
  }));
}

/** The type picker in English — kept for callers that don't pass a language yet. */
export const PAYMENT_METHOD_TYPE_OPTIONS = paymentMethodTypeOptions("en");

/** Only these ask for the last 4 digits. */
export const CARD_TYPES: PaymentMethodType[] = ["CREDIT_CARD", "DEBIT_CARD"];

export const LAST4_ERROR = translate(LABEL_MESSAGES, "en", "method.last4Error");

/**
 * The last 4 is optional, but the API only takes exactly four digits: "123"
 * used to reach the server, come back as a 400 and leave the wizard stuck
 * behind a generic "could not save". Checked before sending instead.
 */
export function last4Error(value: string, language: Language = "en"): string | null {
  return value === "" || /^\d{4}$/.test(value)
    ? null
    : translate(LABEL_MESSAGES, language, "method.last4Error");
}

/**
 * Second-field suggestions, shown only for the types listed here — presence in
 * this map is what makes the field appear. Cards get a network, wallets a
 * provider, bank transfers the *kind* of transfer (a bank offers several and
 * they behave differently: an Autogiro is pulled, a transfer is pushed). Cash,
 * crypto and Other have no useful fixed list.
 */
export const NETWORK_SUGGESTIONS: Partial<Record<PaymentMethodType, string[]>> = {
  CREDIT_CARD: [
    "Visa",
    "Mastercard",
    "American Express",
    "Discover",
    "Diners Club",
    "JCB",
    "UnionPay",
  ],
  DEBIT_CARD: ["Visa", "Mastercard", "American Express", "Discover"],
  DIGITAL_WALLET: [
    "Wise",
    "PayPal",
    "Revolut",
    "Venmo",
    "Cash App",
    "Zelle",
    "Swish",
    "Apple Pay",
    "Google Pay",
  ],
  BANK_TRANSFER: [
    "Transfer",
    "Autogiro",
    "Direct debit",
    "E-invoice",
    "Standing order",
    "SEPA",
    "PSE",
    "Bizum",
  ],
};

/** Label for the second field — differs by vocabulary, not behavior. */
export function networkFieldLabel(type: PaymentMethodType, language: Language = "en"): string {
  const key =
    type === "DIGITAL_WALLET" || type === "BANK_TRANSFER"
      ? (`method.network.${type}` as const)
      : "method.network.card";
  return translate(LABEL_MESSAGES, language, key);
}

interface Named {
  name: string;
}

/** Locale-aware, case-insensitive name order for every methods dropdown. */
export function sortByName<T extends Named>(methods: T[]): T[] {
  return [...methods].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );
}

interface Typed extends Named {
  type: PaymentMethodType;
}

/** Methods grouped in PAYMENT_METHOD_TYPES order, sorted by name inside each group. */
export function groupMethodsByType<T extends Typed>(
  methods: T[],
  language: Language = "en"
): { type: PaymentMethodType; label: string; methods: T[] }[] {
  return paymentMethodTypeOptions(language)
    .map(({ value, label }) => ({
      type: value,
      label,
      methods: sortByName(methods.filter((m) => m.type === value)),
    }))
    .filter((g) => g.methods.length > 0);
}
