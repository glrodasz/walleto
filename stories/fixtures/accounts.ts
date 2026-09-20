import type { Account, AccountDomain } from "../../types";
import { monthsAgo, ts, STORY_USER_ID } from "./time";

const created = ts(monthsAgo(9));

export const STORY_ACCOUNTS: Account[] = [
  {
    id: "acc-avanza",
    userId: STORY_USER_ID,
    domain: "INVESTMENT",
    name: "Avanza ISK",
    provider: "Avanza",
    currency: "SEK",
    interestRate: { value: 7, period: "YEARLY" },
    createdAt: created,
  },
  {
    id: "acc-coinbase",
    userId: STORY_USER_ID,
    domain: "INVESTMENT",
    name: "Coinbase",
    provider: "Coinbase",
    currency: "USD",
    createdAt: created,
  },
  {
    id: "acc-emergency",
    userId: STORY_USER_ID,
    domain: "SAVING",
    name: "Emergency fund",
    provider: "Wise",
    currency: "USD",
    interestRate: { value: 3.5, period: "YEARLY" },
    createdAt: created,
  },
  {
    id: "acc-trip",
    userId: STORY_USER_ID,
    domain: "SAVING",
    name: "Japan trip",
    provider: "Revolut",
    currency: "EUR",
    createdAt: created,
  },
  {
    id: "acc-visa",
    userId: STORY_USER_ID,
    domain: "DEBT",
    name: "Visa Gold",
    provider: "SEB",
    currency: "USD",
    interestRate: { value: 19.9, period: "YEARLY" },
    createdAt: created,
  },
  {
    id: "acc-mortgage",
    userId: STORY_USER_ID,
    domain: "DEBT",
    name: "Apartment mortgage",
    provider: "SEB",
    currency: "SEK",
    interestRate: { value: 3.2, period: "YEARLY" },
    createdAt: created,
  },
];

export function accountsFor(domain: AccountDomain | "ALL" | null): Account[] {
  if (!domain) return [];
  return domain === "ALL" ? STORY_ACCOUNTS : STORY_ACCOUNTS.filter((a) => a.domain === domain);
}
