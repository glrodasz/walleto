import { render, screen } from "@testing-library/react";
import { Amount, formatAmount, formatCompact, formatNative } from "./Amount";

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

describe("Amount", () => {
  it("renders the formatted value", () => {
    render(<Amount value={1150} currency="USD" />);
    expect(screen.getByText(/\$1,150\.00/)).toBeInTheDocument();
  });

  it("marks converted aggregates as approximate", () => {
    render(<Amount value={100} currency="USD" approximate />);
    expect(screen.getByText("≈")).toBeInTheDocument();
  });

  it("appends the ISO code when asked", () => {
    render(<Amount value={100} currency="COP" showCode />);
    expect(screen.getByText("COP")).toBeInTheDocument();
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
