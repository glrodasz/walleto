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
