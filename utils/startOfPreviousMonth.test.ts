import { startOfPreviousMonth } from "./startOfPreviousMonth";

describe("startOfPreviousMonth", () => {
  it("returns midnight on the 1st of the month before", () => {
    const result = startOfPreviousMonth(new Date(2026, 7, 31, 15, 30));
    expect(result).toEqual(new Date(2026, 6, 1));
  });

  it("rolls over a year boundary", () => {
    const result = startOfPreviousMonth(new Date(2026, 0, 10));
    expect(result).toEqual(new Date(2025, 11, 1));
  });
});
