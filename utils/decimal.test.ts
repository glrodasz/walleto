import { parseDecimal, roundTo, sanitizeDecimal, toInputString } from "./decimal";

describe("parseDecimal", () => {
  it.each([
    ["1.5", 1.5, 1.5],
    ["1,5", 1.5, 1.5],
    ["12,5", 12.5, 12.5],
    ["1.000", 1, 1000],
    ["1,000", 1000, 1],
    ["1.234,56", 1234.56, 1234.56],
    ["1,234.56", 1234.56, 1234.56],
    ["1.234.567", 1234567, 1234567],
    ["1,234,567", 1234567, 1234567],
    ["1.2345", 1.2345, 1.2345],
    ["1.", 1, 1],
    [".5", 0.5, 0.5],
    ["  42 ", 42, 42],
    ["-2,5", -2.5, -2.5],
  ])("reads %s as %s with a point and %s with a comma", (raw, withPoint, withComma) => {
    expect(parseDecimal(raw, ".")).toBe(withPoint);
    expect(parseDecimal(raw, ",")).toBe(withComma);
  });

  it("is null when no digit survives", () => {
    for (const raw of ["", ".", ",", "-", "abc", " "]) {
      expect(parseDecimal(raw, ".")).toBeNull();
      expect(parseDecimal(raw, ",")).toBeNull();
    }
  });

  it("defaults to a point", () => {
    expect(parseDecimal("1.000")).toBe(1);
  });
});

describe("sanitizeDecimal", () => {
  it("keeps digits and both separators, dropping everything else", () => {
    expect(sanitizeDecimal("$1,234.5abc")).toBe("1,234.5");
  });

  it("keeps a leading minus only when asked", () => {
    expect(sanitizeDecimal("-2,5")).toBe("2,5");
    expect(sanitizeDecimal("-2,5", { negative: true })).toBe("-2,5");
    expect(parseDecimal(sanitizeDecimal("-2,5"), ",")).toBe(2.5);
    // A minus in the middle is noise, not a sign.
    expect(sanitizeDecimal("2-5", { negative: true })).toBe("25");
  });
});

describe("toInputString", () => {
  it("writes the stored number with the user's separator", () => {
    expect(toInputString(12.5, ".")).toBe("12.5");
    expect(toInputString(12.5, ",")).toBe("12,5");
    expect(toInputString(1200, ",")).toBe("1200");
    expect(toInputString(-0.25, ",")).toBe("-0,25");
  });
});

describe("roundTo", () => {
  it("rounds half up like Intl, on both sides of zero", () => {
    expect(roundTo(1.005, 2)).toBe(1.01);
    expect(roundTo(-1.005, 2)).toBe(-1.01);
    expect(roundTo(2.5, 0)).toBe(3);
    expect(roundTo(1.23456, 4)).toBe(1.2346);
    expect(roundTo(7, 2)).toBe(7);
  });
});
