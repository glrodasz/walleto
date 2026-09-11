/** "Good morning" until noon, "Good afternoon" until six, "Good evening" after. */
export function greeting(now: Date = new Date()): string {
  const hour = now.getHours();
  if (hour < 5) return "Good evening";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
