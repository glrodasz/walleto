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

const currentKey = (() => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
})();

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

    act(() => result.current.select("2024-03"));
    expect(result.current.selectedKey).toBe("2024-03");
    expect(result.current.window.longLabel).toBe("March 2024");
    expect(result.current.window.isCurrent).toBe(false);
    expect(replace).toHaveBeenCalledWith(
      { pathname: "/expenses", query: { month: "2024-03" } },
      undefined,
      { shallow: true }
    );
  });

  it("hydrates from ?month= and never goes past the current month", () => {
    query = { month: "2024-01" };
    const { result } = renderHook(() => useSelectedMonth(), { wrapper });
    expect(result.current.selectedKey).toBe("2024-01");

    act(() => result.current.select("2999-12"));
    expect(result.current.selectedKey).toBe(currentKey);

    act(() => result.current.select("garbage"));
    expect(result.current.selectedKey).toBe(currentKey);
  });

  it("steps one month at a time", () => {
    query = { month: "2024-03" };
    const { result } = renderHook(() => useSelectedMonth(), { wrapper });
    act(() => result.current.step(-1));
    expect(result.current.selectedKey).toBe("2024-02");
    act(() => result.current.step(1));
    expect(result.current.selectedKey).toBe("2024-03");
  });

  it("re-applies the month after a navigation that dropped the query", () => {
    query = { month: "2024-03" };
    const { result } = renderHook(() => useSelectedMonth(), { wrapper });
    expect(result.current.selectedKey).toBe("2024-03");
    replace.mockClear();
    query = {};
    act(() => {
      for (const fn of listeners.routeChangeComplete ?? []) fn("/incomes");
    });
    expect(replace).toHaveBeenCalledWith(
      { pathname: "/incomes", query: { month: "2024-03" } },
      undefined,
      { shallow: true }
    );

    // A destination that already names a month is left alone.
    replace.mockClear();
    act(() => {
      for (const fn of listeners.routeChangeComplete ?? []) fn("/incomes?month=2024-02");
    });
    expect(replace).not.toHaveBeenCalled();
  });

  it("falls back to a fixed current month without a provider", () => {
    const { result } = renderHook(() => useSelectedMonth());
    expect(result.current.selectedKey).toBe(currentKey);
    act(() => result.current.select("2024-03"));
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
