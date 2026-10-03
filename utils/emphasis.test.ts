import { splitEmphasis } from "./emphasis";

describe("splitEmphasis", () => {
  it("returns plain text untouched", () => {
    expect(splitEmphasis("just words")).toEqual([{ text: "just words", strong: false }]);
  });

  it("marks the runs between ** pairs", () => {
    expect(splitEmphasis("see **what you earn** and **where it goes**.")).toEqual([
      { text: "see ", strong: false },
      { text: "what you earn", strong: true },
      { text: " and ", strong: false },
      { text: "where it goes", strong: true },
      { text: ".", strong: false },
    ]);
  });

  it("handles emphasis at the very start and end", () => {
    expect(splitEmphasis("**all of it**")).toEqual([{ text: "all of it", strong: true }]);
  });

  it("leaves an unclosed marker's text plain instead of showing the stars", () => {
    expect(splitEmphasis("a **b** c **d")).toEqual([
      { text: "a ", strong: false },
      { text: "b", strong: true },
      { text: " c d", strong: false },
    ]);
  });

  it("returns nothing for an empty string", () => {
    expect(splitEmphasis("")).toEqual([]);
  });
});
