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

/** Cadences whose cycle outlasts a month: their real amount is asked for once the cycle is over. */
const LONG_CYCLES = new Set<RecurrentTransaction["frequency"]>(["QUARTERLY", "YEARLY"]);

/**
 * When a variable row's period is over and its real amount can be asked for.
 * The period is the row's calendar month: September's bill is asked for on
 * October 1st, even when the item next charges on the 28th. A weekly item
 * closes sooner, with its next occurrence; a quarterly or yearly one closes
 * with its cycle (a year later for a yearly one). A one-off, or a row whose
 * item is gone, closes with its calendar month. The row's own date never
 * moves: it only says which period the money belongs to.
 */
export function cycleEnd(occurredAt: Date, item?: Schedule): Date {
  const monthEnd = new Date(occurredAt.getFullYear(), occurredAt.getMonth() + 1, 1);
  if (item && item.frequency !== "ONE_TIME") {
    const next = nextOccurrenceFrom(item.startDate.toDate(), item.frequency, occurredAt, {
      secondDayOfMonth: item.secondDayOfMonth,
    });
    if (next) {
      const nextDay = new Date(next.getFullYear(), next.getMonth(), next.getDate());
      if (LONG_CYCLES.has(item.frequency) || nextDay < monthEnd) return nextDay;
    }
  }
  return monthEnd;
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

interface PendingCandidate extends Omit<PendingRow, "occurredAt"> {
  /** A Firestore Timestamp in the app, a Date in tests. */
  occurredAt: Date | { toDate(): Date };
  recurrentTransactionId?: string;
}

const dateOf = (d: PendingCandidate["occurredAt"]) => (d instanceof Date ? d : d.toDate());

/**
 * Every row waiting for its real amount, newest first: the period that just
 * closed is the one the owner remembers, and the list shows only the latest
 * few until older ones are confirmed. Each row is checked against the schedule of the
 * item that wrote it, so a yearly item only asks once its year is over.
 */
export function pendingConfirmations<T extends PendingCandidate>(
  rows: T[],
  items: (Schedule & { id?: string })[],
  enabled: boolean,
  now: Date = new Date()
): T[] {
  if (!enabled) return [];
  const byId = new Map(items.filter((i) => i.id).map((i) => [i.id!, i]));
  return rows
    .filter((row) =>
      isPendingConfirmation(
        { ...row, occurredAt: dateOf(row.occurredAt) },
        row.recurrentTransactionId ? byId.get(row.recurrentTransactionId) : undefined,
        enabled,
        now
      )
    )
    .sort((a, b) => dateOf(b.occurredAt).getTime() - dateOf(a.occurredAt).getTime());
}
