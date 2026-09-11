export interface Page<T> {
  rows: T[];
  /** 1-based, clamped into [1, pageCount]. */
  page: number;
  pageCount: number;
}

/** One page of `rows`; an out-of-range page (after a delete, say) clamps. */
export function paginate<T>(rows: T[], page: number, size: number): Page<T> {
  const pageCount = Math.max(1, Math.ceil(rows.length / size));
  const current = Math.min(Math.max(1, Math.floor(page) || 1), pageCount);
  const start = (current - 1) * size;
  return { rows: rows.slice(start, start + size), page: current, pageCount };
}
