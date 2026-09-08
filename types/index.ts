// Structural interface compatible with both firebase-admin and firebase client SDK Timestamps
export interface Timestamp {
  seconds: number;
  nanoseconds: number;
  toDate(): Date;
}

import type { CURRENCIES } from "../constants";

export type Currency = (typeof CURRENCIES)[number];
export type Domain = "INCOME" | "EXPENSE" | "INVESTMENT" | "SAVING";
export type Frequency = "ONE_TIME" | "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";

export type TransactionStatus = "PENDING" | "PAID" | "SKIPPED";

export type PaymentMethodType =
  | "CREDIT_CARD"
  | "DEBIT_CARD"
  | "BANK_TRANSFER"
  | "DIGITAL_WALLET"
  | "CASH"
  | "CRYPTO_WALLET"
  | "OTHER";

export type RecurrentTransactionType =
  | "SUBSCRIPTION"
  | "SALARY"
  | "SAVINGS_TRANSFER"
  | "LOAN_PAYMENT"
  | "UTILITY"
  | "OTHER";

export interface User {
  id: string;
  mainCurrency: Currency;
  /** Reporting currency override for dashboards; falls back to mainCurrency. */
  displayCurrency?: Currency;
  onboardingCompleted: boolean;
  onboardingMode?: "MAGIC" | "ASSISTED";
  createdAt: Timestamp;
}

export interface Category {
  id?: string;
  userId: string;
  domain: Domain;
  name: string;
  parentId?: string;
  isDefault?: boolean;
  archived?: boolean;
  createdAt: Timestamp;
}

export interface PaymentMethod {
  id?: string;
  userId: string;
  name: string;
  type: PaymentMethodType;
  currencies: Currency[];
  defaultCurrency?: Currency;
  last4?: string;
  network?: string;
  archived?: boolean;
  createdAt: Timestamp;
}

export interface RecurrentTransaction {
  id?: string;
  userId: string;
  domain: Domain;
  categoryId: string;
  name: string;
  amount: number;
  currency: Currency;
  chargedAmount?: number;
  chargedCurrency?: Currency;
  frequency: Frequency;
  /** BIWEEKLY only: twice a month, on startDate's day and this one. */
  secondDayOfMonth?: number;
  type?: RecurrentTransactionType;
  paymentMethodId?: string;
  serviceSnapshot?: {
    serviceId: string;
    name: string;
    logoUrl?: string;
  };
  startDate: Timestamp;
  endDate?: Timestamp;
  nextOccurrence?: Timestamp;
  active: boolean;
  createdAt?: Timestamp;
}

export interface Transaction {
  id?: string;
  userId: string;
  domain: Domain;
  recurrentTransactionId?: string;
  categoryId: string;
  name: string;
  amount: number;
  currency: Currency;
  chargedAmount?: number;
  chargedCurrency?: Currency;
  paymentMethodId?: string;
  occurredAt: Timestamp;
  status: TransactionStatus;
  createdAt?: Timestamp;
}

/**
 * A point-in-time statement of what an investment category is worth. Cost
 * basis and value are snapshots in `currency` at recording time, so history
 * stays truthful when rates or items change later.
 */
export interface InvestmentValuation {
  id?: string;
  userId: string;
  categoryId: string;
  asOf: Timestamp;
  /** 0 = break-even, 100 = doubled, -20 = lost a fifth. */
  gainPct: number;
  value: number;
  costBasis: number;
  currency: Currency;
  note?: string;
  createdAt?: Timestamp;
}

export interface ServicePrice {
  tier: string;
  amount: number;
  currency: Currency;
  frequency: Frequency;
}

// Prices keyed by ISO 3166-1 alpha-2 country code ("US", "CO", "MX", etc.)
// Use key "DEFAULT" for services with a single global price (no per-country variation)
export interface Service {
  id?: string;
  name: string;
  logoUrl?: string;
  domain: Domain;
  defaultCategoryHint?: string;
  prices: Record<string, ServicePrice[]>;
  active: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
