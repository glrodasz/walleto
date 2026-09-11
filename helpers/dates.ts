import type { DateFormat } from "../types";

/**
 * Every date the interface prints goes through here, so the user's
 * preference (Settings › Preferences › Date format) applies everywhere.
 *
 *   day        "Sep 6"   · "6 Sep"   · "2026-09-06"
 *   dayYear    "Sep 6, 2026" · "6 Sep 2026" · "2026-09-06"
 *   month      "Sep"      (format-independent)
 *   monthYear  "Sep 2026" (format-independent)
 *   monthLong  "September 2026" (format-independent)
 *   numeric    "09/06/2026" · "06/09/2026" · "2026-09-06"
 */
export type DateStyle = "day" | "dayYear" | "month" | "monthYear" | "monthLong" | "numeric";

export const DEFAULT_DATE_FORMAT: DateFormat = "MDY";

export const DATE_FORMAT_LABELS: Record<DateFormat, string> = {
  YMD: "YYYY-MM-DD",
  DMY: "DD/MM/YYYY",
  MDY: "MM/DD/YYYY",
};

const LOCALE: Record<DateFormat, string> = { MDY: "en-US", DMY: "en-GB", YMD: "en-CA" };

const OPTIONS: Record<DateStyle, Intl.DateTimeFormatOptions> = {
  day: { month: "short", day: "numeric" },
  dayYear: { month: "short", day: "numeric", year: "numeric" },
  month: { month: "short" },
  monthYear: { month: "short", year: "numeric" },
  monthLong: { month: "long", year: "numeric" },
  numeric: { year: "numeric", month: "2-digit", day: "2-digit" },
};

const cache = new Map<string, Intl.DateTimeFormat>();

function formatter(style: DateStyle, format: DateFormat): Intl.DateTimeFormat {
  const key = `${style}:${format}`;
  let f = cache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(LOCALE[format], OPTIONS[style]);
    cache.set(key, f);
  }
  return f;
}

const pad = (n: number) => String(n).padStart(2, "0");

export function formatDate(
  date: Date,
  style: DateStyle,
  format: DateFormat = DEFAULT_DATE_FORMAT
): string {
  // Month labels never depend on the preference (and en-GB would say "Sept").
  if (style === "month" || style === "monthYear" || style === "monthLong") {
    return formatter(style, "MDY").format(date);
  }
  // ISO days are written by hand: locales disagree on separators.
  if (format === "YMD") {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }
  // Day-first keeps the US month abbreviation ("6 Sep", not "6 Sept").
  if (format === "DMY" && style !== "numeric") {
    const month = formatter("month", "MDY").format(date);
    return style === "day"
      ? `${date.getDate()} ${month}`
      : `${date.getDate()} ${month} ${date.getFullYear()}`;
  }
  return formatter(style, format).format(date);
}
