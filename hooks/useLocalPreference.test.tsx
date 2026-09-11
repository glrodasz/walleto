import { act, renderHook } from "@testing-library/react";
import { useLocalPreference } from "./useLocalPreference";

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
