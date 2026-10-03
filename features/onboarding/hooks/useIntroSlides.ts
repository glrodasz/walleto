import { useCallback, useState } from "react";

export type IntroDirection = "forward" | "back";

/**
 * Which intro slide is showing, and which way the last move went (so the
 * scene can enter from the matching side). The index never leaves the range.
 */
export function useIntroSlides(total: number) {
  const [state, setState] = useState<{ index: number; direction: IntroDirection }>({
    index: 0,
    direction: "forward",
  });

  const goTo = useCallback(
    (target: number) =>
      setState((prev) => {
        const index = Math.min(Math.max(target, 0), total - 1);
        if (index === prev.index) return prev;
        return { index, direction: index > prev.index ? "forward" : "back" };
      }),
    [total]
  );

  const next = useCallback(() => goTo(state.index + 1), [goTo, state.index]);
  const back = useCallback(() => goTo(state.index - 1), [goTo, state.index]);

  return {
    index: state.index,
    direction: state.direction,
    total,
    isFirst: state.index === 0,
    isLast: state.index === total - 1,
    next,
    back,
    goTo,
  };
}
