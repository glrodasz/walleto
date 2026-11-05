import { toMonthlyAmount } from "../../../helpers/aggregations";
import type { MoneyContext } from "../../../helpers/aggregations";
import { matchesSelector } from "../../investments/helpers/valuation";
import type { AccountValueRow } from "../../investments/helpers/domainValue";
import type { RecurrentTransaction, Transaction } from "../../../types";

export interface DebtSummaryRow {
  row: AccountValueRow;
  /** What the plan repays each month, in the reporting currency; 0 when nothing is planned. */
  monthly: number;
  /** Known and nothing left: shown as paid off, without payment actions. */
  paidOff: boolean;
  /** The category a quick payment is filed under: the plan's, else the debt's latest row's. */
  categoryId: string | null;
}

export interface DebtSummary {
  rows: DebtSummaryRow[];
  /** Everything still owed whose balance is known. */
  owed: number;
  /** Everything the plan repays each month. */
  monthly: number;
  /** Debts with no balance yet (no check, no recorded borrowing): left out of `owed`. */
  unknown: number;
}

const occurred = (t: Transaction) => t.occurredAt.toDate().getTime();

/**
 * The Debts page's "What you owe": every debt with its balance and what the
 * plan pays towards it each month. The two are different numbers on purpose
 * — the balance feeds net worth, the monthly payment feeds the month — so
 * they sit side by side and never add up. Still owed first, largest first;
 * unknown balances, then paid-off debts, at the bottom.
 */
export function debtSummary(
  valueRows: AccountValueRow[],
  items: RecurrentTransaction[],
  transactions: Transaction[],
  ctx: MoneyContext
): DebtSummary {
  const rows = valueRows.map((row): DebtSummaryRow => {
    const plan = items.filter(
      (i) => i.domain === "DEBT" && i.active && matchesSelector(i, row.selector)
    );
    const latest = transactions
      .filter((t) => t.domain === "DEBT" && matchesSelector(t, row.selector))
      .sort((a, b) => occurred(b) - occurred(a))[0];
    return {
      row,
      monthly: plan.reduce((sum, i) => sum + toMonthlyAmount(i, ctx), 0),
      paidOff: row.known && row.value <= 0.005,
      categoryId: plan[0]?.categoryId ?? latest?.categoryId ?? row.latest?.categoryId ?? null,
    };
  });

  const rank = (r: DebtSummaryRow) => (r.paidOff ? 2 : r.row.known ? 0 : 1);
  rows.sort((a, b) => rank(a) - rank(b) || b.row.value - a.row.value);

  return {
    rows,
    owed: rows.reduce((sum, r) => sum + (r.row.known ? Math.max(0, r.row.value) : 0), 0),
    monthly: rows.reduce((sum, r) => sum + r.monthly, 0),
    unknown: rows.filter((r) => !r.row.known).length,
  };
}
