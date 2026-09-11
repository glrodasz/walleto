/** Midnight on the 1st of the month before `now`, in local time. */
export function startOfPreviousMonth(now: Date = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth() - 1, 1);
}
