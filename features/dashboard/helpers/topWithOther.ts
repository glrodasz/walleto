export interface CategoryRow {
  categoryId: string;
  name: string;
  amount: number;
  percent: number;
}

/**
 * Caps a category breakdown at `limit` rows, folding the remainder into a
 * single "Other" bucket so the bars always account for 100% of the money.
 */
export function topWithOther(rows: CategoryRow[], limit: number): CategoryRow[] {
  if (rows.length <= limit) return rows;

  const top = rows.slice(0, limit);
  const rest = rows.slice(limit);
  return [
    ...top,
    {
      categoryId: "__other",
      name: "Other",
      amount: rest.reduce((sum, r) => sum + r.amount, 0),
      percent: rest.reduce((sum, r) => sum + r.percent, 0),
    },
  ];
}
