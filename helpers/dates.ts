import { INTL_LOCALE } from "./i18n";
import type { DateFormat, Language } from "../types";

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
 *
 * In Spanish, month names come from Intl ("sept", "septiembre de 2026") and a
 * named-month day is always day-first ("6 sept"), whatever the preference;
 * numeric and ISO dates still follow it. Standalone month labels start with a
 * capital ("Sept 2026"), since they head columns and pickers.
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

function formatter(style: DateStyle, locale: string): Intl.DateTimeFormat {
  const key = `${style}:${locale}`;
  let f = cache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(locale, OPTIONS[style]);
    cache.set(key, f);
  }
  return f;
}

const capitalize = (text: string) => text.charAt(0).toLocaleUpperCase() + text.slice(1);

/** "sept" — Intl's abbreviation without the trailing period some locales add. */
function shortMonth(date: Date, locale: string): string {
  return formatter("month", locale).format(date).replace(/\.$/, "");
}

const pad = (n: number) => String(n).padStart(2, "0");

/** "2026-09" — the stable identity of a calendar month. */
export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

export function formatDate(
  date: Date,
  style: DateStyle,
  format: DateFormat = DEFAULT_DATE_FORMAT,
  language: Language = "en"
): string {
  if (language !== "en") return formatDateIn(date, style, format, INTL_LOCALE[language]);
  // Month labels never depend on the preference (and en-GB would say "Sept").
  if (style === "month" || style === "monthYear" || style === "monthLong") {
    return formatter(style, LOCALE.MDY).format(date);
  }
  // ISO days are written by hand: locales disagree on separators.
  if (format === "YMD") return isoDay(date);
  // Day-first keeps the US month abbreviation ("6 Sep", not "6 Sept").
  if (format === "DMY" && style !== "numeric") {
    const month = formatter("month", LOCALE.MDY).format(date);
    return style === "day"
      ? `${date.getDate()} ${month}`
      : `${date.getDate()} ${month} ${date.getFullYear()}`;
  }
  return formatter(style, LOCALE[format]).format(date);
}

const isoDay = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** Every language but English: Intl's month names, day-first. */
function formatDateIn(date: Date, style: DateStyle, format: DateFormat, locale: string): string {
  if (style === "month") return capitalize(shortMonth(date, locale));
  if (style === "monthYear") return capitalize(`${shortMonth(date, locale)} ${date.getFullYear()}`);
  if (style === "monthLong") return capitalize(formatter("monthLong", locale).format(date));
  if (format === "YMD") return isoDay(date);
  if (style === "numeric") return formatter("numeric", LOCALE[format]).format(date);
  const dayMonth = `${date.getDate()} ${shortMonth(date, locale)}`;
  return style === "day" ? dayMonth : `${dayMonth} ${date.getFullYear()}`;
}
