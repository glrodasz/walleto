import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { MonthProvider, isMonthKey, useSelectedMonth, windowForKey } from "./useSelectedMonth";

const replace = jest.fn();
let query: Record<string, string> = {};
let isReady = true;
const listeners: Record<string, Array<(url: string) => void>> = {};

jest.mock("next/router", () => ({
  useRouter: () => ({
    pathname: "/expenses",
    query,
    isReady,
    replace,
    events: {
      on: (name: string, fn: (url: string) => void) => {
        (listeners[name] ??= []).push(fn);
      },
      off: (name: string, fn: (url: string) => void) => {
        listeners[name] = (listeners[name] ?? []).filter((f) => f !== fn);
      },
    },
  }),
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <MonthProvider>{children}</MonthProvider>
);

const NOW = new Date();
/** `back` months before the current one — the picker only offers 24. */
const keyBack = (back: number) => {
  const d = new Date(NOW.getFullYear(), NOW.getMonth() - back, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
const longLabelBack = (back: number) =>
  new Date(NOW.getFullYear(), NOW.getMonth() - back, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
const currentKey = keyBack(0);
const oldestKey = keyBack(23);

describe("useSelectedMonth", () => {
  beforeEach(() => {
    replace.mockClear();
    query = {};
    isReady = true;
    for (const k of Object.keys(listeners)) delete listeners[k];
  });

  it("defaults to the current month and mirrors a selection into the URL", () => {
    const { result } = renderHook(() => useSelectedMonth(), { wrapper });
    expect(result.current.selectedKey).toBe(currentKey);
    expect(result.current.window.isCurrent).toBe(true);

    act(() => result.current.select(keyBack(6)));
    expect(result.current.selectedKey).toBe(keyBack(6));
    expect(result.current.window.longLabel).toBe(longLabelBack(6));
    expect(result.current.window.isCurrent).toBe(false);
    expect(replace).toHaveBeenCalledWith(
      { pathname: "/expenses", query: { month: keyBack(6) } },
      undefined,
      { shallow: true }
    );
  });

  it("hydrates from ?month= and stays inside the months the picker offers", () => {
    query = { month: keyBack(9) };
    const { result } = renderHook(() => useSelectedMonth(), { wrapper });
    expect(result.current.selectedKey).toBe(keyBack(9));

    act(() => result.current.select("2999-12"));
    expect(result.current.selectedKey).toBe(currentKey);

    // Older than the picker goes: clamped up, not accepted — otherwise the
    // pages build windows back to it and its arrows have nothing to step through.
    act(() => result.current.select("1990-01"));
    expect(result.current.selectedKey).toBe(oldestKey);

    act(() => result.current.select("garbage"));
    expect(result.current.selectedKey).toBe(oldestKey);
  });

  it("clamps a ?month= older than the picker when hydrating", () => {
    query = { month: "1990-01" };
    const { result } = renderHook(() => useSelectedMonth(), { wrapper });
    expect(result.current.selectedKey).toBe(oldestKey);
    expect(result.current.pickerWindows[0].key).toBe(oldestKey);
  });

  it("steps one month at a time", () => {
    query = { month: keyBack(6) };
    const { result } = renderHook(() => useSelectedMonth(), { wrapper });
    act(() => result.current.step(-1));
    expect(result.current.selectedKey).toBe(keyBack(7));
    act(() => result.current.step(1));
    expect(result.current.selectedKey).toBe(keyBack(6));
  });

  it("re-applies the month after a navigation that dropped the query", () => {
    query = { month: keyBack(6) };
    const { result } = renderHook(() => useSelectedMonth(), { wrapper });
    expect(result.current.selectedKey).toBe(keyBack(6));
    replace.mockClear();
    query = {};
    act(() => {
      for (const fn of listeners.routeChangeComplete ?? []) fn("/incomes");
    });
    expect(replace).toHaveBeenCalledWith(
      { pathname: "/incomes", query: { month: keyBack(6) } },
      undefined,
      { shallow: true }
    );

    // A destination that already names a month is left alone.
    replace.mockClear();
    act(() => {
      for (const fn of listeners.routeChangeComplete ?? []) fn(`/incomes?month=${keyBack(7)}`);
    });
    expect(replace).not.toHaveBeenCalled();
  });

  it("falls back to a fixed current month without a provider", () => {
    const { result } = renderHook(() => useSelectedMonth());
    expect(result.current.selectedKey).toBe(currentKey);
    act(() => result.current.select(keyBack(6)));
    expect(result.current.selectedKey).toBe(currentKey);
  });

  it("offers two years of months in the picker, ending with the current one", () => {
    const { result } = renderHook(() => useSelectedMonth(), { wrapper });
    const keys = result.current.pickerWindows.map((w) => w.key);
    expect(keys).toHaveLength(24);
    expect(keys[keys.length - 1]).toBe(currentKey);
  });
});

describe("helpers", () => {
  it("validates month keys", () => {
    expect(isMonthKey("2026-09")).toBe(true);
    expect(isMonthKey("2026-13")).toBe(false);
    expect(isMonthKey("2026-9")).toBe(false);
    expect(isMonthKey(undefined)).toBe(false);
  });

  it("builds a window for a key", () => {
    const w = windowForKey("2026-02", new Date(2026, 8, 11));
    expect(w.start).toEqual(new Date(2026, 1, 1));
    expect(w.end).toEqual(new Date(2026, 2, 1));
    expect(w.isCurrent).toBe(false);
    expect(windowForKey("2026-09", new Date(2026, 8, 11)).isCurrent).toBe(true);
  });
});
