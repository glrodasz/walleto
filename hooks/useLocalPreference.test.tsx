import { act, renderHook } from "@testing-library/react";
import { useLocalPreference } from "./useLocalPreference";
import { DEFAULT_MONTH_PERIOD, parseMonthPeriod } from "../constants";
import type { MonthPeriod } from "../constants";

describe("useLocalPreference", () => {
  beforeEach(() => localStorage.clear());

  it("starts with the default and remembers a change", () => {
    const { result } = renderHook(() => useLocalPreference("k", "a"));
    expect(result.current[0]).toBe("a");
    act(() => result.current[1]("b"));
    expect(result.current[0]).toBe("b");
    expect(localStorage.getItem("k")).toBe('"b"');
  });

  it("reads a stored value after mount", () => {
    localStorage.setItem("k", JSON.stringify(6));
    const { result } = renderHook(() => useLocalPreference("k", 3));
    expect(result.current[0]).toBe(6);
  });

  it("ignores unreadable storage", () => {
    localStorage.setItem("k", "{not json");
    const { result } = renderHook(() => useLocalPreference("k", "fallback"));
    expect(result.current[0]).toBe("fallback");
  });
});

describe("useLocalPreference — a stored value the app no longer offers", () => {
  it("falls back to the default instead of handing back a stale choice", () => {
    // The chart periods were 7 and 12 before they became 3, 6 and 12. A stored
    // 7 parses fine, so without a guard the chart drew seven months while the
    // <select>, having no matching option, showed the first one.
    localStorage.setItem("waletto:chart:EXPENSE:period", "7");
    const { result } = renderHook(() =>
      useLocalPreference<MonthPeriod>(
        "waletto:chart:EXPENSE:period",
        DEFAULT_MONTH_PERIOD,
        parseMonthPeriod
      )
    );
    expect(result.current[0]).toBe(DEFAULT_MONTH_PERIOD);
  });

  it("keeps a stored value that is still offered", () => {
    localStorage.setItem("waletto:chart:EXPENSE:period", "12");
    const { result } = renderHook(() =>
      useLocalPreference<MonthPeriod>(
        "waletto:chart:EXPENSE:period",
        DEFAULT_MONTH_PERIOD,
        parseMonthPeriod
      )
    );
    expect(result.current[0]).toBe(12);
  });
});
