import { translate } from "../../../helpers/i18n";
import { COMMON_MESSAGES } from "../../../messages/common";
import type { Language } from "../../../types";
import { PROSPECT_MESSAGES } from "../messages";

/**
 * How long the runway reads: months up to a year ("4.5 months"), years and
 * whole months past it ("5 years 2 months") — nobody counts 62 months.
 * `formatNumber` is the user's number format, used only for the months form.
 */
export function formatRunway(
  months: number,
  formatNumber: (n: number, decimals?: number) => string,
  language: Language = "en"
): string {
  if (months <= 12) {
    return translate(PROSPECT_MESSAGES, language, "runway.months", {
      count: months,
      value: formatNumber(months, 1),
    });
  }
  let years = Math.floor(months / 12);
  let rest = Math.round(months - years * 12);
  if (rest === 12) {
    years += 1;
    rest = 0;
  }
  const yearsText = translate(COMMON_MESSAGES, language, "count.years", { count: years });
  if (rest === 0) return yearsText;
  return translate(PROSPECT_MESSAGES, language, "runway.yearsAndMonths", {
    years: yearsText,
    months: translate(COMMON_MESSAGES, language, "count.months", { count: rest }),
  });
}
