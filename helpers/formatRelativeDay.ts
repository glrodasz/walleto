import { COMMON_MESSAGES } from "../messages/common";
import { formatDate } from "./dates";
import { INTL_LOCALE, translate } from "./i18n";
import type { DateFormat, Language } from "../types";

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
export function formatRelativeDay(
  date: Date,
  now: Date = new Date(),
  format?: DateFormat,
  language: Language = "en"
): string {
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / DAY_MS);
  if (diffDays === 0) return translate(COMMON_MESSAGES, language, "noun.today");
  if (diffDays === 1) return translate(COMMON_MESSAGES, language, "noun.yesterday");
  if (diffDays > 1 && diffDays < 7)
    return new Intl.RelativeTimeFormat(INTL_LOCALE[language], { numeric: "auto" }).format(
      -diffDays,
      "day"
    );
  return formatDate(date, "day", format, language);
}
