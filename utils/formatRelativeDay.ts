const DAY_MS = 86400000;

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/**
 * "Today", "Yesterday", "3 days ago" within a week, otherwise "Jun 4". Counts
 * calendar days, not 24-hour spans, so last night's payment is "Yesterday"
 * at breakfast. The short form every payment list uses, so a payment recorded
 * a moment ago reads the same way on the dashboard and on its domain page.
 */
export function formatRelativeDay(date: Date, now: Date = new Date()): string {
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / DAY_MS);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays > 1 && diffDays < 7)
    return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(-diffDays, "day");
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
}
