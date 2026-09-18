import { GAIN_KEY, withGains } from "./gainStack";
import type { StackedTotals } from "../../../helpers/stacks";

const byCategory: StackedTotals = {
  series: [
    { key: "funds", label: "Funds", color: "var(--tint-investment-1)" },
    { key: "crypto", label: "Crypto", color: "var(--tint-investment-2)" },
  ],
  totals: {
    "2026-01": { funds: 500, crypto: 200 },
    "2026-02": { funds: 500, crypto: 0 },
  },
};

describe("withGains", () => {
  it("appends the gain last so it caps the stack", () => {
    const out = withGains(byCategory, { "2026-01": 120, "2026-02": 0 });
    expect(out.series.map((s) => s.key)).toEqual(["funds", "crypto", GAIN_KEY]);
    expect(out.totals["2026-01"]).toEqual({ funds: 500, crypto: 200, [GAIN_KEY]: 120 });
    expect(out.totals["2026-02"][GAIN_KEY]).toBe(0);
  });

  it("works the same on a currency stack — a gain has no currency of its own", () => {
    const byCurrency: StackedTotals = {
      series: [{ key: "USD", label: "USD", color: "#000" }],
      totals: { "2026-01": { USD: 500 } },
    };
    const out = withGains(byCurrency, { "2026-01": 80 });
    expect(out.series.map((s) => s.key)).toEqual(["USD", GAIN_KEY]);
    expect(out.totals["2026-01"][GAIN_KEY]).toBe(80);
  });

  it("keeps a losing month negative rather than clamping it", () => {
    const out = withGains(byCategory, { "2026-01": -240, "2026-02": 0 });
    expect(out.totals["2026-01"][GAIN_KEY]).toBe(-240);
  });

  it("leaves the stack untouched when no month reported a gain", () => {
    expect(withGains(byCategory, { "2026-01": 0, "2026-02": 0 })).toBe(byCategory);
    expect(withGains(byCategory, {})).toBe(byCategory);
  });

  it("fills in zero for a window the gains record never mentions", () => {
    const out = withGains(byCategory, { "2026-01": 120 });
    expect(out.totals["2026-02"][GAIN_KEY]).toBe(0);
  });
});
