import { formatRunway } from "./runwayDuration";

const fmt = (n: number, decimals = 2) => String(Number(n.toFixed(decimals)));

describe("formatRunway", () => {
  it("keeps months up to a year", () => {
    expect(formatRunway(4.5, fmt)).toBe("4.5 months");
    expect(formatRunway(1, fmt)).toBe("1 month");
    expect(formatRunway(12, fmt)).toBe("12 months");
  });

  it("switches to years and months past a year", () => {
    expect(formatRunway(62, fmt)).toBe("5 years 2 months");
    expect(formatRunway(13, fmt)).toBe("1 year 1 month");
    expect(formatRunway(25.4, fmt)).toBe("2 years 1 month");
  });

  it("drops the months when they round to none", () => {
    expect(formatRunway(24.2, fmt)).toBe("2 years");
    expect(formatRunway(12.3, fmt)).toBe("1 year");
  });

  it("carries a rounded twelfth month into a year", () => {
    expect(formatRunway(23.8, fmt)).toBe("2 years");
  });
});

describe("formatRunway in Spanish", () => {
  it("pluralises months and years and joins them with y", () => {
    expect(formatRunway(1, fmt, "es")).toBe("1 mes");
    expect(formatRunway(4.5, fmt, "es")).toBe("4.5 meses");
    expect(formatRunway(13, fmt, "es")).toBe("1 año y 1 mes");
    expect(formatRunway(62, fmt, "es")).toBe("5 años y 2 meses");
  });
});
