import { IDENTITY_RATES, convert, tryConvert } from "./fx";
import type { ExchangeRates } from "./fx";

const RATES: ExchangeRates = {
  base: "USD",
  rates: {
    USD: 1,
    EUR: 0.9,
    MXN: 17,
    GBP: 0.8,
    SEK: 10,
    CHF: 0.95,
    JPY: 150,
    COP: 4000,
  },
  fetchedAt: "2026-06-01T00:00:00.000Z",
};

describe("convert", () => {
  it("is the identity when from === to", () => {
    expect(convert(123.45, "COP", "COP", RATES)).toBe(123.45);
  });

  it("converts from USD using the direct rate", () => {
    expect(convert(100, "USD", "COP", RATES)).toBe(400_000);
  });

  it("converts to USD using the inverse rate", () => {
    expect(convert(400_000, "COP", "USD", RATES)).toBe(100);
  });

  it("cross-converts through USD for non-USD pairs", () => {
    // 90 EUR -> 100 USD -> 400,000 COP
    expect(convert(90, "EUR", "COP", RATES)).toBeCloseTo(400_000);
  });

  it("round-trips within floating error", () => {
    const there = convert(1234.56, "SEK", "JPY", RATES);
    expect(convert(there, "JPY", "SEK", RATES)).toBeCloseTo(1234.56);
  });

  it("IDENTITY_RATES leaves every amount untouched", () => {
    expect(convert(777, "EUR", "COP", IDENTITY_RATES)).toBe(777);
  });
});

describe("tryConvert", () => {
  it("still works for same-currency without rates", () => {
    expect(tryConvert(50, "USD", "USD", null)).toBe(50);
  });

  it("returns null when rates are absent", () => {
    expect(tryConvert(50, "USD", "COP", null)).toBeNull();
  });

  it("returns null for a non-positive rate", () => {
    const broken = { ...RATES, rates: { ...RATES.rates, COP: 0 } };
    expect(tryConvert(50, "USD", "COP", broken)).toBeNull();
  });

  it("matches convert when rates are valid", () => {
    expect(tryConvert(90, "EUR", "COP", RATES)).toBeCloseTo(convert(90, "EUR", "COP", RATES));
  });
});
