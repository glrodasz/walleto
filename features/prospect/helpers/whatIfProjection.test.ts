import { buildWhatIfProjection } from "./whatIfProjection";

describe("buildWhatIfProjection", () => {
  it("accumulates each series month over month", () => {
    const points = buildWhatIfProjection(100, 20, 3, new Date(2026, 0, 15));

    expect(points).toHaveLength(3);
    expect(points.map((p) => p.income)).toEqual([100, 200, 300]);
    expect(points.map((p) => p.expense)).toEqual([120, 240, 360]);
  });

  it("labels points by calendar month starting the month after now", () => {
    const points = buildWhatIfProjection(100, 0, 2, new Date(2026, 11, 1));
    expect(points.map((p) => p.label)).toEqual(["Jan", "Feb"]);
  });

  it("the two series coincide when nothing is freed", () => {
    const points = buildWhatIfProjection(50, 0, 4, new Date(2026, 0, 1));
    expect(points.every((p) => p.income === p.expense)).toBe(true);
  });

  it("handles a negative current net (overspending) correctly", () => {
    const points = buildWhatIfProjection(-50, 30, 2, new Date(2026, 0, 1));
    expect(points.map((p) => p.income)).toEqual([-50, -100]);
    expect(points.map((p) => p.expense)).toEqual([-20, -40]);
  });

  it("returns an empty series for zero months", () => {
    expect(buildWhatIfProjection(100, 10, 0)).toEqual([]);
  });
});
