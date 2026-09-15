import {
  materializeOccurrences,
  occurrenceToTransaction,
} from "../../helpers/materializeOccurrences";
import type { Domain, Transaction } from "../../types";
import { STORY_RECURRENT } from "./recurrent";
import { monthsAgo, NOW, ts, STORY_USER_ID } from "./time";

/** How far back the ledger goes: the seven months the domain charts show. */
const HISTORY_START = monthsAgo(6);

/** The current month's charges after today are still pending. */
function statusFor(occurredAt: Date): Transaction["status"] {
  return occurredAt > NOW ? "PENDING" : "PAID";
}

/**
 * The ledger, derived from the plan exactly the way the app's materializer
 * does it (deterministic ids, native + charged pairs), plus a few one-offs.
 */
function buildLedger(): Transaction[] {
  const monthEnd = new Date(NOW.getFullYear(), NOW.getMonth() + 1, 1);
  const rows: Transaction[] = [];

  for (const item of STORY_RECURRENT) {
    for (const occ of materializeOccurrences(item, HISTORY_START, monthEnd)) {
      const base = occurrenceToTransaction(item, occ.occurredAt);
      rows.push({
        ...base,
        id: occ.id,
        occurredAt: ts(occ.occurredAt),
        status: statusFor(occ.occurredAt),
        createdAt: ts(occ.occurredAt),
      });
    }
  }

  const oneOff = (
    id: string,
    domain: Domain,
    categoryId: string,
    name: string,
    amount: number,
    currency: Transaction["currency"],
    date: Date,
    extra: Partial<Transaction> = {}
  ): Transaction => ({
    id,
    userId: STORY_USER_ID,
    domain,
    categoryId,
    name,
    amount,
    currency,
    occurredAt: ts(date),
    status: "PAID",
    createdAt: ts(date),
    ...extra,
  });

  rows.push(
    oneOff(
      "tx-flight",
      "EXPENSE",
      "cat-expense-travel",
      "Flight to Tokyo",
      1180,
      "USD",
      monthsAgo(1, 8),
      {
        paymentMethodId: "pm-chase",
        tags: ["tag-trip"],
        note: "Round trip, October",
      }
    ),
    oneOff(
      "tx-coffee",
      "EXPENSE",
      "cat-expense-variable",
      "Coffee beans",
      64000,
      "COP",
      monthsAgo(0, 4),
      {
        paymentMethodId: "pm-cash",
        chargedAmount: 64000,
        chargedCurrency: "COP",
      }
    ),
    oneOff(
      "tx-bonus",
      "INCOME",
      "cat-income-extra",
      "Referral bonus",
      500,
      "USD",
      monthsAgo(2, 19),
      {
        paymentMethodId: "pm-wise",
      }
    ),
    oneOff(
      "tx-eth",
      "INVESTMENT",
      "cat-investment-crypto",
      "Ethereum buy",
      250,
      "USD",
      monthsAgo(3, 11),
      {
        accountId: "acc-coinbase",
        paymentMethodId: "pm-wise",
      }
    )
  );

  return rows.sort((a, b) => a.occurredAt.seconds - b.occurredAt.seconds);
}

export const STORY_TRANSACTIONS: Transaction[] = buildLedger();

export function transactionsFor(domain: Domain, startDate?: Date): Transaction[] {
  const from = startDate ? startDate.getTime() / 1000 : 0;
  // Mirrors the Firestore query: paid rows in the domain from `startDate` on.
  return STORY_TRANSACTIONS.filter(
    (t) => t.domain === domain && t.status === "PAID" && t.occurredAt.seconds >= from
  );
}
