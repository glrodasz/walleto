const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"}`;

/**
 * How long the runway reads: months up to a year ("4.5 months"), years and
 * whole months past it ("5 years 2 months") — nobody counts 62 months.
 * `formatNumber` is the user's number format, used only for the months form.
 */
export function formatRunway(
  months: number,
  formatNumber: (n: number, decimals?: number) => string
): string {
  if (months <= 12) return `${formatNumber(months, 1)} ${months === 1 ? "month" : "months"}`;
  let years = Math.floor(months / 12);
  let rest = Math.round(months - years * 12);
  if (rest === 12) {
    years += 1;
    rest = 0;
  }
  return rest === 0 ? plural(years, "year") : `${plural(years, "year")} ${plural(rest, "month")}`;
}
