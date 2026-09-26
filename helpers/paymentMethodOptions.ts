import { PAYMENT_METHOD_TYPE_LABELS } from "../constants";
import type { PaymentMethodType } from "../types";

/** The type picker in step 2 of the wizard, in display order. */
export const PAYMENT_METHOD_TYPE_OPTIONS: { value: PaymentMethodType; label: string }[] = (
  [
    "CREDIT_CARD",
    "DEBIT_CARD",
    "BANK_TRANSFER",
    "DIGITAL_WALLET",
    "CASH",
    "CRYPTO_WALLET",
    "OTHER",
  ] as PaymentMethodType[]
).map((value) => ({ value, label: PAYMENT_METHOD_TYPE_LABELS[value] }));

/** Only these ask for the last 4 digits. */
export const CARD_TYPES: PaymentMethodType[] = ["CREDIT_CARD", "DEBIT_CARD"];

export const LAST4_ERROR = "Enter all 4 digits, or leave it empty";

/**
 * The last 4 is optional, but the API only takes exactly four digits: "123"
 * used to reach the server, come back as a 400 and leave the wizard stuck
 * behind a generic "could not save". Checked before sending instead.
 */
export function last4Error(value: string): string | null {
  return value === "" || /^\d{4}$/.test(value) ? null : LAST4_ERROR;
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
export function networkFieldLabel(type: PaymentMethodType): string {
  if (type === "DIGITAL_WALLET") return "Provider";
  if (type === "BANK_TRANSFER") return "Method";
  return "Card network";
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

/** Methods grouped in PAYMENT_METHOD_TYPE_OPTIONS order, sorted by name inside each group. */
export function groupMethodsByType<T extends Typed>(
  methods: T[]
): { type: PaymentMethodType; label: string; methods: T[] }[] {
  return PAYMENT_METHOD_TYPE_OPTIONS.map(({ value, label }) => ({
    type: value,
    label,
    methods: sortByName(methods.filter((m) => m.type === value)),
  })).filter((g) => g.methods.length > 0);
}
