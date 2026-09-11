import { act, renderHook } from "@testing-library/react";
import { useWhatIf } from "./useWhatIf";

describe("useWhatIf", () => {
  it("starts with nothing excluded", () => {
    const { result } = renderHook(() => useWhatIf());
    expect(result.current.excludedIds.size).toBe(0);
  });

  it("toggle adds then removes an id", () => {
    const { result } = renderHook(() => useWhatIf());

    act(() => result.current.toggle("a"));
    expect(result.current.excludedIds.has("a")).toBe(true);

    act(() => result.current.toggle("a"));
    expect(result.current.excludedIds.has("a")).toBe(false);
  });

  it("tracks multiple ids independently", () => {
    const { result } = renderHook(() => useWhatIf());

    act(() => {
      result.current.toggle("a");
      result.current.toggle("b");
    });
    expect([...result.current.excludedIds].sort()).toEqual(["a", "b"]);
  });

  it("reset clears everything", () => {
    const { result } = renderHook(() => useWhatIf());

    act(() => result.current.toggle("a"));
    act(() => result.current.reset());
    expect(result.current.excludedIds.size).toBe(0);
  });
});
