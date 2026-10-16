import { formatDate } from "./dates";

const d = new Date(2026, 8, 6); // Sep 6 2026

describe("formatDate", () => {
  it("writes days per preference", () => {
    expect(formatDate(d, "day", "MDY")).toBe("Sep 6");
    expect(formatDate(d, "day", "DMY")).toBe("6 Sep");
    expect(formatDate(d, "day", "YMD")).toBe("2026-09-06");
  });

  it("writes days with a year per preference", () => {
    expect(formatDate(d, "dayYear", "MDY")).toBe("Sep 6, 2026");
    expect(formatDate(d, "dayYear", "DMY")).toBe("6 Sep 2026");
    expect(formatDate(d, "dayYear", "YMD")).toBe("2026-09-06");
  });

  it("writes numeric dates per preference", () => {
    expect(formatDate(d, "numeric", "MDY")).toBe("09/06/2026");
    expect(formatDate(d, "numeric", "DMY")).toBe("06/09/2026");
    expect(formatDate(d, "numeric", "YMD")).toBe("2026-09-06");
  });

  it("keeps month labels format-independent", () => {
    for (const f of ["MDY", "DMY", "YMD"] as const) {
      expect(formatDate(d, "month", f)).toBe("Sep");
      expect(formatDate(d, "monthYear", f)).toBe("Sep 2026");
      expect(formatDate(d, "monthLong", f)).toBe("September 2026");
    }
  });

  it("defaults to month-first", () => {
    expect(formatDate(d, "day")).toBe("Sep 6");
  });
});

describe("formatDate in Spanish", () => {
  it("names months in Spanish, day-first", () => {
    expect(formatDate(d, "day", "MDY", "es")).toBe("6 sept");
    expect(formatDate(d, "dayYear", "DMY", "es")).toBe("6 sept 2026");
  });

  it("capitalizes standalone month labels", () => {
    expect(formatDate(d, "month", "MDY", "es")).toBe("Sept");
    expect(formatDate(d, "monthYear", "MDY", "es")).toBe("Sept 2026");
    expect(formatDate(d, "monthLong", "MDY", "es")).toBe("Septiembre de 2026");
  });

  it("keeps numeric and ISO dates on the preference", () => {
    expect(formatDate(d, "numeric", "DMY", "es")).toBe("06/09/2026");
    expect(formatDate(d, "day", "YMD", "es")).toBe("2026-09-06");
  });
});
