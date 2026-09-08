import { convertedAmount } from "../../../helpers/aggregations";
import type { MoneyContext, MoneyFields } from "../../../helpers/aggregations";
import { bucketStart, toDate } from "../../../helpers/chartData";
import { materializeOccurrences, occurrenceId } from "../../../helpers/materializeOccurrences";
import { formatRelativeDay } from "../../../utils/formatRelativeDay";
import type { RecurrentTransaction, Transaction } from "../../../types";

/** One calendar month on the page: [start, end). */
export interface MonthWindow {
  /** "2026-09" — stable identity for selection and lookups. */
  key: string;
  start: Date;
  end: Date;
  /** "Sep" */
  label: string;
  /** "September 2026" */
  longLabel: string;
  isCurrent: boolean;
}

const SHORT = new Intl.DateTimeFormat("en", { month: "short" });
const LONG = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" });

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * The last `count` months ending with the current one, oldest first. Built
 * from y/m/d so the 29th–31st never overflow into the following month.
 */
export function monthWindows(count = 7, now: Date = new Date()): MonthWindow[] {
  const windows: MonthWindow[] = [];
  for (let n = count - 1; n >= 0; n--) {
    const start = new Date(now.getFullYear(), now.getMonth() - n, 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    windows.push({
      key: monthKey(start),
      start,
      end,
      label: SHORT.format(start),
      longLabel: LONG.format(start),
      isCurrent: n === 0,
    });
  }
  return windows;
}

interface MoneyTransaction extends MoneyFields {
  occurredAt: unknown;
}

/** Converted total of the transactions inside each window, keyed by month. */
export function monthTotals(
  transactions: MoneyTransaction[],
  ctx: MoneyContext,
  windows: MonthWindow[]
): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const w of windows) totals[w.key] = 0;
  for (const t of transactions) {
    const key = monthKey(bucketStart(toDate(t.occurredAt), "month"));
    if (key in totals) totals[key] += convertedAmount(t, ctx);
  }
  return totals;
}

export interface PlannedOccurrence {
  item: RecurrentTransaction;
  occurredAt: Date;
  /** Converted into the reporting currency. */
  amount: number;
}

/**
 * Every occurrence of an active item strictly inside [from, to]. This is the
 * forecast engine: with `from = now` it yields what is still to come, with no
 * double count against transactions that already landed.
 */
export function plannedOccurrences(
  items: RecurrentTransaction[],
  ctx: MoneyContext,
  from: Date,
  to: Date
): PlannedOccurrence[] {
  const out: PlannedOccurrence[] = [];
  for (const item of items) {
    if (!item.active) continue;
    const amount = convertedAmount(item, ctx);
    for (const occ of materializeOccurrences(item, from, to)) {
      out.push({ item, occurredAt: occ.occurredAt, amount });
    }
  }
  return out.sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
}

export function plannedRemaining(
  items: RecurrentTransaction[],
  ctx: MoneyContext,
  from: Date,
  to: Date
): number {
  return plannedOccurrences(items, ctx, from, to).reduce((sum, o) => sum + o.amount, 0);
}

/**
 * What the month is expected to total: for the month in progress, what has
 * landed plus what the plan still owes before month end; for a finished
 * month, simply what landed.
 */
export function expectedForMonth(
  window: MonthWindow,
  realized: number,
  items: RecurrentTransaction[],
  ctx: MoneyContext,
  now: Date = new Date()
): number {
  if (!window.isCurrent) return realized;
  return realized + plannedRemaining(items, ctx, now, new Date(window.end.getTime() - 1));
}

/** Mean of the finished months only; the month in progress would drag it down. */
export function trailingAverage(
  totals: Record<string, number>,
  windows: MonthWindow[]
): number | null {
  const complete = windows.filter((w) => !w.isCurrent);
  if (complete.length === 0) return null;
  return complete.reduce((sum, w) => sum + (totals[w.key] ?? 0), 0) / complete.length;
}

export type OccurrenceStatus = "paid" | "due" | "overdue";

export interface MonthOccurrence {
  item: RecurrentTransaction;
  occurredAt: Date;
  status: OccurrenceStatus;
  /** Converted into the reporting currency. */
  amount: number;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * The month's checklist: each active item's occurrences inside the window,
 * marked paid when a PAID transaction sits at the deterministic id (or on the
 * same day for the same item — mark-paid can land on a different clock), due
 * when still ahead, overdue otherwise. Items with nothing this month are
 * returned separately so the page can show them collapsed.
 */
export function monthOccurrences(
  items: RecurrentTransaction[],
  transactions: Transaction[],
  ctx: MoneyContext,
  window: MonthWindow,
  now: Date = new Date()
): { occurrences: MonthOccurrence[]; notThisMonth: RecurrentTransaction[] } {
  const paidIds = new Set(transactions.map((t) => t.id).filter(Boolean));
  const paidByItem = new Map<string, Date[]>();
  for (const t of transactions) {
    if (!t.recurrentTransactionId) continue;
    const list = paidByItem.get(t.recurrentTransactionId) ?? [];
    list.push(toDate(t.occurredAt));
    paidByItem.set(t.recurrentTransactionId, list);
  }

  const occurrences: MonthOccurrence[] = [];
  const notThisMonth: RecurrentTransaction[] = [];
  const to = new Date(window.end.getTime() - 1);

  for (const item of items) {
    if (!item.active || !item.id) continue;
    const occs = materializeOccurrences(item, window.start, to);
    if (occs.length === 0) {
      notThisMonth.push(item);
      continue;
    }
    const amount = convertedAmount(item, ctx);
    for (const occ of occs) {
      const paid =
        paidIds.has(occurrenceId(item.id, occ.occurredAt)) ||
        (paidByItem.get(item.id) ?? []).some((d) => sameDay(d, occ.occurredAt));
      const status: OccurrenceStatus = paid ? "paid" : occ.occurredAt >= now ? "due" : "overdue";
      occurrences.push({ item, occurredAt: occ.occurredAt, status, amount });
    }
  }

  occurrences.sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
  return { occurrences, notThisMonth };
}

export interface DayGroup {
  key: string;
  label: string;
  /** Converted subtotal for the day. */
  total: number;
  rows: Transaction[];
}

/** Transactions grouped by calendar day, newest day first, newest row first. */
export function groupByDay(
  transactions: Transaction[],
  ctx: MoneyContext,
  now: Date = new Date()
): DayGroup[] {
  const groups = new Map<string, DayGroup>();
  const sorted = [...transactions].sort(
    (a, b) => toDate(b.occurredAt).getTime() - toDate(a.occurredAt).getTime()
  );
  for (const t of sorted) {
    const date = toDate(t.occurredAt);
    const key = `${monthKey(date)}-${String(date.getDate()).padStart(2, "0")}`;
    let group = groups.get(key);
    if (!group) {
      group = { key, label: formatRelativeDay(date, now), total: 0, rows: [] };
      groups.set(key, group);
    }
    group.total += convertedAmount(t, ctx);
    group.rows.push(t);
  }
  return Array.from(groups.values());
}
