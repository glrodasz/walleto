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
  /** Root only: left out of the domain graph and month figure (children follow). */
  hiddenFromChart?: boolean;
  archived?: boolean;
  createdAt: Timestamp;
}

/**
 * A label shared by every entry the user files under it. `name` keeps the
 * case it was entered with (whitespace removed); `key` is its lowercase form
 * and is unique per user, so "Trip2026" and "trip2026" are one tag.
 */
export interface Tag {
  id?: string;
  userId: string;
  name: string;
  key: string;
  archived?: boolean;
  createdAt?: Timestamp;
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

/** Domains whose entries can be filed under an account / pocket. */
export type AccountDomain = "INVESTMENT" | "SAVING";
export type InterestPeriod = "MONTHLY" | "YEARLY";

/** A rate as quoted by the bank or broker; `helpers/interest` normalises it. */
export interface InterestRate {
  value: number;
  period: InterestPeriod;
}

/**
 * An investment account or a savings pocket ("Avanza ISK", "Emergency fund").
 * Categories classify; accounts are *where* the money sits, so valuations and
 * interest attach here, not to the category.
 */
export interface Account {
  id?: string;
  userId: string;
  domain: AccountDomain;
  name: string;
  /** Bank or broker, free text. */
  provider?: string;
  currency: Currency;
  interestRate?: InterestRate;
  archived?: boolean;
  createdAt?: Timestamp;
}

export interface RecurrentTransaction {
  id?: string;
  userId: string;
  domain: Domain;
  categoryId: string;
  /** INVESTMENT / SAVING only: the account or pocket the money goes into. */
  accountId?: string;
  name: string;
  amount: number;
  currency: Currency;
  chargedAmount?: number;
  chargedCurrency?: Currency;
  /** Tag ids (see `Tag`). */
  tags?: string[];
  note?: string;
  /** Copy the tags / note onto every payment the item writes. */
  inheritTags?: boolean;
  inheritNote?: boolean;
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
  /** Kept out of every dashboard number and list; domain pages still show it. */
  hiddenFromDashboard?: boolean;
  createdAt?: Timestamp;
}

export interface Transaction {
  id?: string;
  userId: string;
  domain: Domain;
  recurrentTransactionId?: string;
  categoryId: string;
  /** INVESTMENT / SAVING only: inherited from the item or picked on the form. */
  accountId?: string;
  name: string;
  amount: number;
  currency: Currency;
  chargedAmount?: number;
  chargedCurrency?: Currency;
  /** Tag ids (see `Tag`). */
  tags?: string[];
  note?: string;
  paymentMethodId?: string;
  occurredAt: Timestamp;
  status: TransactionStatus;
  createdAt?: Timestamp;
}

/**
 * A point-in-time statement of what an account / pocket — or the domain's
 * "No account" bucket — is worth. `domain` is always written; `accountId`
 * names the account, absent for the bucket. `categoryId` only survives on
 * valuations written before accounts existed (no `domain` on those). Cost
 * basis and value are snapshots in `currency` at recording time, so history
 * stays truthful when rates or items change later.
 */
export interface InvestmentValuation {
  id?: string;
  userId: string;
  domain?: AccountDomain;
  accountId?: string;
  /** Legacy: the category a pre-account valuation was recorded on. */
  categoryId?: string;
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
