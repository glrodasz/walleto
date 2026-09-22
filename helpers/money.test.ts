import {
  formatAmount,
  formatCompact,
  formatNative,
  formatNumber,
  formatPercent,
  MONEY_MASK,
} from "./money";

/** Intl separates an ISO code from the number with a non-breaking space. */
const norm = (s: string) => s.replace(/\u00a0/g, " ");

describe("formatAmount", () => {
  it("keeps cents for decimal currencies", () => {
    expect(formatAmount(1150, "USD")).toBe("$1,150.00");
  });

  it("drops cents for zero-decimal currencies", () => {
    expect(norm(formatAmount(220000, "COP"))).toBe("COP 220,000");
    expect(formatAmount(1499, "JPY")).toBe("¥1,499");
  });

  it("groups every currency the same way", () => {
    // The old per-currency locale rendered COP as "$ 220.000" (es-CO), where
    // the dot is a thousands separator — it reads as $220 next to a US row.
    expect(formatAmount(220000, "COP")).not.toContain("220.000");
    expect(formatAmount(1234.5, "EUR")).toBe("€1,234.50");
  });

  it("writes the ISO code on request", () => {
    expect(norm(formatAmount(220000, "COP", { code: true }))).toBe("COP 220,000");
    expect(norm(formatAmount(95, "EUR", { code: true }))).toBe("EUR 95.00");
  });

  it("renders zero and negatives", () => {
    expect(formatAmount(0, "USD")).toBe("$0.00");
    expect(formatAmount(-42.5, "USD")).toBe("-$42.50");
  });
});

describe("formatNative", () => {
  it("uses the symbol when the row matches the display currency", () => {
    expect(formatNative(1150, "USD", "USD")).toBe("$1,150.00");
  });

  it("uses the ISO code when it differs", () => {
    expect(norm(formatNative(220000, "COP", "USD"))).toBe("COP 220,000");
    expect(norm(formatNative(449, "SEK", "USD"))).toBe("SEK 449.00");
  });

  it("disambiguates the currencies that share a symbol", () => {
    expect(norm(formatNative(500, "MXN", "USD"))).toBe("MXN 500.00");
  });
});

describe("formatCompact", () => {
  it("abbreviates axis ticks with the currency made explicit", () => {
    expect(formatCompact(60_000, "USD")).toBe("$60K");
    expect(norm(formatCompact(58_275, "SEK"))).toBe("SEK 58.3K");
    expect(norm(formatCompact(4_000_000, "COP"))).toBe("COP 4M");
    expect(formatCompact(0, "USD")).toBe("$0");
  });
});

describe("privacy mode", () => {
  it("swaps the number for the mask and keeps the currency", () => {
    expect(formatAmount(1150, "USD", { hidden: true })).toBe(`$${MONEY_MASK}`);
    expect(norm(formatAmount(220000, "COP", { hidden: true }))).toBe(`COP ${MONEY_MASK}`);
  });

  it("masks the whole number, not digit by digit", () => {
    // A mask that kept the shape ("$*,***.**") would still give away the
    // order of magnitude, which is most of what is worth hiding.
    expect(formatAmount(1_234_567.89, "USD", { hidden: true })).toBe(
      formatAmount(9.99, "USD", { hidden: true })
    );
  });

  it("leaves no digit behind, whatever the sign or scale", () => {
    for (const value of [0, -42.5, 1499, 1_000_000]) {
      expect(formatAmount(value, "USD", { hidden: true })).not.toMatch(/\d/);
      expect(formatCompact(value, "SEK", { hidden: true })).not.toMatch(/\d/);
    }
  });

  it("drops the compact suffix, which is the magnitude itself", () => {
    expect(formatCompact(60_000, "USD", { hidden: true })).toBe(`$${MONEY_MASK}`);
    expect(norm(formatCompact(4_000_000, "COP", { hidden: true }))).toBe(`COP ${MONEY_MASK}`);
  });

  it("still distinguishes a foreign row from a local one", () => {
    expect(norm(formatNative(449, "SEK", "USD", { hidden: true }))).toBe(`SEK ${MONEY_MASK}`);
    expect(formatNative(449, "USD", "USD", { hidden: true })).toBe(`$${MONEY_MASK}`);
  });
});

describe("number preferences", () => {
  it("swaps the separators without moving the symbol", () => {
    expect(formatAmount(1234.5, "EUR", { separator: "," })).toBe("€1.234,50");
    expect(formatAmount(-42.5, "USD", { separator: "," })).toBe("-$42,50");
    expect(norm(formatNative(220000, "COP", "USD", { separator: "," }))).toBe("COP 220.000");
    expect(norm(formatCompact(58_275, "SEK", { separator: "," }))).toBe("SEK 58,3K");
  });

  it("prints the decimals asked for, except on zero-decimal currencies", () => {
    expect(formatAmount(1234.5678, "USD", { decimals: 0 })).toBe("$1,235");
    expect(formatAmount(1234.5678, "USD", { decimals: 3 })).toBe("$1,234.568");
    expect(formatAmount(1234.5678, "USD", { decimals: 4, separator: "," })).toBe("$1.234,5678");
    expect(formatAmount(1499.4, "JPY", { decimals: 4 })).toBe("¥1,499");
  });

  it("formats plain numbers and percentages the same way", () => {
    expect(formatNumber(2.5)).toBe("2.5");
    expect(formatNumber(19.9, { separator: "," })).toBe("19,9");
    expect(formatNumber(1234.5678, { maxDecimals: 2 })).toBe("1,234.57");
    expect(formatNumber(3, { minDecimals: 2, maxDecimals: 2 })).toBe("3.00");
    expect(formatPercent(16.666)).toBe("16.7%");
    expect(formatPercent(-1.25, 1, ",")).toBe("-1,3%");
  });

  it("masks with either separator", () => {
    expect(formatAmount(1150, "USD", { hidden: true, separator: "," })).toBe(`$${MONEY_MASK}`);
  });
});
