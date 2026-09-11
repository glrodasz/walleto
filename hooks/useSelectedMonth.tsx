import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/router";
import { monthKey, monthWindows } from "../features/domains/helpers/months";
import type { MonthWindow } from "../features/domains/helpers/months";

export const MONTH_QUERY = "month";
const KEY_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
/** How far back the header picker lets you go. */
const PICKER_MONTHS = 24;

export function isMonthKey(value: unknown): value is string {
  return typeof value === "string" && KEY_PATTERN.test(value);
}

/** The window for one month key, with `isCurrent` judged against `now`. */
export function windowForKey(key: string, now: Date): MonthWindow {
  const [y, m] = key.split("-").map(Number);
  const [w] = monthWindows(1, new Date(y, m - 1, 1));
  return { ...w, isCurrent: key === monthKey(now) };
}

interface SelectedMonth {
  /** One clock per app mount, so every page agrees on what "now" is. */
  now: Date;
  currentKey: string;
  /** Never later than `currentKey`. */
  selectedKey: string;
  window: MonthWindow;
  /** The months the header picker offers, oldest first, ending with the current one. */
  pickerWindows: MonthWindow[];
  select: (key: string) => void;
  step: (delta: -1 | 1) => void;
}

function clampKey(key: string, currentKey: string): string {
  return key > currentKey ? currentKey : key;
}

function defaultValue(now: Date): SelectedMonth {
  const currentKey = monthKey(now);
  return {
    now,
    currentKey,
    selectedKey: currentKey,
    window: windowForKey(currentKey, now),
    pickerWindows: monthWindows(PICKER_MONTHS, now),
    select: () => {},
    step: () => {},
  };
}

const SelectedMonthContext = createContext<SelectedMonth | null>(null);

/**
 * The month the whole app is looking at. React state is the truth; the URL
 * (`?month=YYYY-MM`) mirrors it so a link or a reload lands on the same
 * month. Navigation between pages keeps the selection: sidebar links drop
 * the param, so it is re-applied after each route change.
 */
export function MonthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const now = useMemo(() => new Date(), []);
  const currentKey = monthKey(now);
  const [selectedKey, setSelectedKey] = useState(currentKey);

  // Hydrate from the URL once the router knows the query.
  useEffect(() => {
    if (!router.isReady) return;
    const fromUrl = router.query[MONTH_QUERY];
    if (isMonthKey(fromUrl)) setSelectedKey(clampKey(fromUrl, currentKey));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  const writeUrl = useCallback(
    (key: string) => {
      const query = { ...router.query };
      if (key === currentKey) delete query[MONTH_QUERY];
      else query[MONTH_QUERY] = key;
      if ((router.query[MONTH_QUERY] ?? currentKey) === key) return;
      void router.replace({ pathname: router.pathname, query }, undefined, { shallow: true });
    },
    [router, currentKey]
  );

  const select = useCallback(
    (key: string) => {
      if (!isMonthKey(key)) return;
      const next = clampKey(key, currentKey);
      setSelectedKey(next);
      writeUrl(next);
    },
    [currentKey, writeUrl]
  );

  const step = useCallback(
    (delta: -1 | 1) => {
      const [y, m] = selectedKey.split("-").map(Number);
      select(monthKey(new Date(y, m - 1 + delta, 1)));
    },
    [selectedKey, select]
  );

  // A page change through a plain <Link> loses the query: put it back. The
  // destination is read from the event's URL, not from `router.query`, which
  // may still describe the page being left.
  useEffect(() => {
    const events = router.events;
    if (!events) return;
    const onDone = (url: string) => {
      if (selectedKey === currentKey) return;
      const target = new URL(url, "http://waletto.local");
      if (isMonthKey(target.searchParams.get(MONTH_QUERY))) return;
      target.searchParams.set(MONTH_QUERY, selectedKey);
      void router.replace(
        { pathname: target.pathname, query: Object.fromEntries(target.searchParams) },
        undefined,
        { shallow: true }
      );
    };
    events.on("routeChangeComplete", onDone);
    return () => events.off("routeChangeComplete", onDone);
  }, [router, selectedKey, currentKey]);

  const value = useMemo<SelectedMonth>(
    () => ({
      now,
      currentKey,
      selectedKey,
      window: windowForKey(selectedKey, now),
      pickerWindows: monthWindows(PICKER_MONTHS, now),
      select,
      step,
    }),
    [now, currentKey, selectedKey, select, step]
  );

  return <SelectedMonthContext.Provider value={value}>{children}</SelectedMonthContext.Provider>;
}

/** Without a provider (tests, isolated renders) the current month is selected and fixed. */
export function useSelectedMonth(): SelectedMonth {
  const ctx = useContext(SelectedMonthContext);
  const fallback = useMemo(() => defaultValue(new Date()), []);
  return ctx ?? fallback;
}
