import { formatAmount, formatCompact, formatNative, MONEY_MASK } from "./money";

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
