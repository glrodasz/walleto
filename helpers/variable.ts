import { nextOccurrenceFrom } from "./recurrence";
import type { Domain, RecurrentTransaction, Scenario } from "../types";

/**
 * Variable expenses: an amount known only as a band (Groceries, €400–600).
 * `amount` is the top of the band and `amountFloor` its bottom, so anything
 * that reads `amount` alone sees the worst case — the safe way to be wrong.
 * A row stops being variable when its real amount is confirmed (the floor is
 * dropped), or stays one for good when the owner says to keep it variable.
 */
export interface BandFields {
  amount: number;
  amountFloor?: number;
}

/** Worst case: what every reader saw before scenarios existed. */
export const DEFAULT_SCENARIO: Scenario = "top";

export function isVariable(row: BandFields): boolean {
  return row.amountFloor !== undefined;
}

/** The native amount a row counts for under a scenario; fixed rows ignore it. */
export function scenarioAmount(row: BandFields, scenario: Scenario = DEFAULT_SCENARIO): number {
  if (row.amountFloor === undefined) return row.amount;
  if (scenario === "floor") return row.amountFloor;
  if (scenario === "average") return (row.amountFloor + row.amount) / 2;
  return row.amount;
}

interface BandCheck extends BandFields {
  domain: Domain;
  chargedAmount?: number;
}

/**
 * Why a band can't be stored, or null when it can. Only expenses vary; the
 * floor sits strictly below the top; and a charged pair records what was
 * actually debited, which contradicts not knowing the amount yet.
 */
export function bandError(row: BandCheck): string | null {
  if (row.amountFloor === undefined) return null;
  if (row.domain !== "EXPENSE") return "A range only applies to expenses";
  if (row.amountFloor >= row.amount) return "The lower amount must be below the upper one";
  if (row.chargedAmount !== undefined) return "A range can't carry a charged amount";
  return null;
}

interface PendingRow extends BandFields {
  occurredAt: Date;
  status: string;
  keepVariable?: boolean;
}

type Schedule = Pick<RecurrentTransaction, "startDate" | "frequency" | "secondDayOfMonth">;

/**
 * When a variable row's cycle is over and its real amount can be asked for:
 * the day the item's next occurrence starts (month end for a monthly item on
 * the 1st, a year later for a yearly one). A one-off, or a row whose item is
 * gone, closes with its calendar month. The row's own date never moves: it
 * only says which period the money belongs to.
 */
export function cycleEnd(occurredAt: Date, item?: Schedule): Date {
  if (item && item.frequency !== "ONE_TIME") {
    const next = nextOccurrenceFrom(item.startDate.toDate(), item.frequency, occurredAt, {
      secondDayOfMonth: item.secondDayOfMonth,
    });
    if (next) return new Date(next.getFullYear(), next.getMonth(), next.getDate());
  }
  return new Date(occurredAt.getFullYear(), occurredAt.getMonth() + 1, 1);
}

/**
 * A paid variable row whose cycle has ended and that nobody confirmed or
 * chose to keep variable. Always false when the owner turned confirmations
 * off in Settings.
 */
export function isPendingConfirmation(
  row: PendingRow,
  item: Schedule | undefined,
  enabled: boolean,
  now: Date = new Date()
): boolean {
  if (!enabled || !isVariable(row) || row.keepVariable || row.status !== "PAID") return false;
  return now >= cycleEnd(row.occurredAt, item);
}
