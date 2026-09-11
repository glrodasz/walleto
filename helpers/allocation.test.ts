import { allocationSegments } from "./allocation";

describe("allocationSegments", () => {
  it("splits income into outflows and what is left", () => {
    const segs = allocationSegments({
      income: 1000,
      expenses: 500,
      investments: 100,
      savings: 150,
      net: 250,
    });
    expect(segs).toEqual([
      { key: "expenses", share: 0.5 },
      { key: "investments", share: 0.1 },
      { key: "savings", share: 0.15 },
      { key: "left", share: 0.25 },
    ]);
    expect(segs.reduce((s, x) => s + x.share, 0)).toBeCloseTo(1);
  });

  it("fills the bar with outflows when the plan overspends", () => {
    const segs = allocationSegments({
      income: 400,
      expenses: 600,
      investments: 0,
      savings: 200,
      net: -400,
    });
    expect(segs.map((s) => s.key)).toEqual(["expenses", "savings"]);
    expect(segs.reduce((s, x) => s + x.share, 0)).toBeCloseTo(1);
  });

  it("is empty without any money", () => {
    expect(
      allocationSegments({ income: 0, expenses: 0, investments: 0, savings: 0, net: 0 })
    ).toEqual([]);
  });
});
