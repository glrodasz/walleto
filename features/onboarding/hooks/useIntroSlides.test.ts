import { act, renderHook } from "@testing-library/react";
import { useIntroSlides } from "./useIntroSlides";

describe("useIntroSlides", () => {
  it("starts on the first slide, moving forward", () => {
    const { result } = renderHook(() => useIntroSlides(6));
    expect(result.current).toMatchObject({
      index: 0,
      direction: "forward",
      total: 6,
      isFirst: true,
      isLast: false,
    });
  });

  it("steps forward and back, remembering which way it went", () => {
    const { result } = renderHook(() => useIntroSlides(6));
    act(() => result.current.next());
    act(() => result.current.next());
    expect(result.current.index).toBe(2);
    expect(result.current.direction).toBe("forward");

    act(() => result.current.back());
    expect(result.current.index).toBe(1);
    expect(result.current.direction).toBe("back");
  });

  it("never leaves the range", () => {
    const { result } = renderHook(() => useIntroSlides(3));
    act(() => result.current.back());
    expect(result.current.index).toBe(0);

    act(() => result.current.goTo(10));
    expect(result.current.index).toBe(2);
    expect(result.current.isLast).toBe(true);

    act(() => result.current.next());
    expect(result.current.index).toBe(2);
  });

  it("jumps to any slide, entering from the matching side", () => {
    const { result } = renderHook(() => useIntroSlides(6));
    act(() => result.current.goTo(4));
    expect(result.current).toMatchObject({ index: 4, direction: "forward" });

    act(() => result.current.goTo(1));
    expect(result.current).toMatchObject({ index: 1, direction: "back" });
  });
});
