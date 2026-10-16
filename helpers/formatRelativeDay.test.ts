import { formatRelativeDay } from "./formatRelativeDay";

describe("formatRelativeDay", () => {
  const now = new Date(2026, 5, 15, 15, 0); // Jun 15, 3pm

  it("names today and yesterday", () => {
    expect(formatRelativeDay(new Date(2026, 5, 15, 9, 0), now)).toBe("Today");
    expect(formatRelativeDay(new Date(2026, 5, 14, 20, 0), now)).toBe("Yesterday");
  });

  it("counts days inside a week and falls back to a short date beyond it", () => {
    expect(formatRelativeDay(new Date(2026, 5, 12, 15, 0), now)).toBe("3 days ago");
    expect(formatRelativeDay(new Date(2026, 5, 1, 15, 0), now)).toBe("Jun 1");
  });

  it("does not describe a future date as days ago", () => {
    expect(formatRelativeDay(new Date(2026, 5, 20, 15, 0), now)).toBe("Jun 20");
  });
});

describe("formatRelativeDay in Spanish", () => {
  const now = new Date(2026, 8, 10, 9);
  it("speaks Spanish", () => {
    expect(formatRelativeDay(new Date(2026, 8, 10), now, "MDY", "es")).toBe("Hoy");
    expect(formatRelativeDay(new Date(2026, 8, 9), now, "MDY", "es")).toBe("Ayer");
    expect(formatRelativeDay(new Date(2026, 8, 7), now, "MDY", "es")).toBe("hace 3 días");
    expect(formatRelativeDay(new Date(2026, 7, 1), now, "MDY", "es")).toBe("1 ago");
  });
});
