import { nextOccurrenceFrom } from "./recurrence";

const d = (iso: string) => new Date(iso);

describe("nextOccurrenceFrom", () => {
  it("returns null for ONE_TIME", () => {
    expect(
      nextOccurrenceFrom(d("2026-01-01T00:00:00Z"), "ONE_TIME", d("2026-06-01T00:00:00Z"))
    ).toBeNull();
  });

  it("returns the start date when the schedule has not begun", () => {
    const start = d("2026-09-01T00:00:00Z");
    expect(nextOccurrenceFrom(start, "MONTHLY", d("2026-06-01T00:00:00Z"))).toEqual(start);
    expect(nextOccurrenceFrom(start, "WEEKLY", d("2026-06-01T00:00:00Z"))).toEqual(start);
  });

  it("advances weekly schedules to the next future date", () => {
    // start Jan 1, now Jan 10 -> next is Jan 15 (2 steps of 7 days)
    const next = nextOccurrenceFrom(d("2026-01-01T00:00:00Z"), "WEEKLY", d("2026-01-10T00:00:00Z"));
    expect(next?.toISOString()).toBe("2026-01-15T00:00:00.000Z");
  });

  it("advances biweekly schedules", () => {
    const next = nextOccurrenceFrom(
      d("2026-01-01T00:00:00Z"),
      "BIWEEKLY",
      d("2026-01-10T00:00:00Z")
    );
    expect(next?.toISOString()).toBe("2026-01-15T00:00:00.000Z");
  });

  it("always returns a date strictly after `from`", () => {
    const start = d("2026-01-01T00:00:00Z");
    const from = d("2026-01-08T00:00:00Z"); // exactly on an occurrence
    const next = nextOccurrenceFrom(start, "WEEKLY", from)!;
    expect(next.getTime()).toBeGreaterThan(from.getTime());
  });

  it("advances monthly schedules", () => {
    const next = nextOccurrenceFrom(
      d("2026-01-15T00:00:00Z"),
      "MONTHLY",
      d("2026-03-20T00:00:00Z")
    )!;
    expect(next.getFullYear()).toBe(2026);
    expect(next.getMonth()).toBe(3); // April
    expect(next.getDate()).toBe(15);
  });

  it("clamps a 31st anchor to the last day of shorter months", () => {
    const next = nextOccurrenceFrom(d("2026-01-31T12:00:00"), "MONTHLY", d("2026-02-01T00:00:00"))!;
    expect(next.getMonth()).toBe(1); // February
    expect(next.getDate()).toBe(28); // 2026 is not a leap year
  });

  it("restores the 31st anchor after passing a short month", () => {
    const next = nextOccurrenceFrom(d("2026-01-31T12:00:00"), "MONTHLY", d("2026-02-28T23:00:00"))!;
    expect(next.getMonth()).toBe(2); // March
    expect(next.getDate()).toBe(31);
  });

  it("advances quarterly and yearly schedules", () => {
    const q = nextOccurrenceFrom(d("2026-01-10T00:00:00"), "QUARTERLY", d("2026-02-01T00:00:00"))!;
    expect(q.getMonth()).toBe(3); // April

    const y = nextOccurrenceFrom(d("2026-01-10T00:00:00"), "YEARLY", d("2026-06-01T00:00:00"))!;
    expect(y.getFullYear()).toBe(2027);
    expect(y.getMonth()).toBe(0);
  });
});

describe("nextOccurrenceFrom — twice a month", () => {
  const start = new Date(2026, 2, 1, 12); // anchored on the 1st, March 2026
  const opts = { secondDayOfMonth: 15 };

  it("alternates between the anchor day and the second day", () => {
    expect(nextOccurrenceFrom(start, "BIWEEKLY", new Date(2026, 8, 6), opts)).toEqual(
      new Date(2026, 8, 15, 12)
    );
    expect(nextOccurrenceFrom(start, "BIWEEKLY", new Date(2026, 8, 15, 12), opts)).toEqual(
      new Date(2026, 9, 1, 12)
    );
  });

  it("clamps the second day to short months and keeps the start when not begun", () => {
    const late = new Date(2026, 0, 1, 12);
    expect(
      nextOccurrenceFrom(late, "BIWEEKLY", new Date(2026, 1, 2), { secondDayOfMonth: 31 })
    ).toEqual(new Date(2026, 1, 28, 12));
    expect(nextOccurrenceFrom(start, "BIWEEKLY", new Date(2026, 0, 1), opts)).toEqual(start);
  });

  it("keeps the 14-day step for items without a second day", () => {
    const next = nextOccurrenceFrom(new Date(2026, 0, 1), "BIWEEKLY", new Date(2026, 0, 10));
    expect(next).toEqual(new Date(2026, 0, 15));
  });
});
