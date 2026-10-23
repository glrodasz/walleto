import { buildUsageSummary, weekStartUtc, weeklySignups } from "./usage";

const NOW = new Date("2026-10-23T12:00:00Z"); // a Friday
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000);

describe("weekStartUtc", () => {
  it("goes back to Monday", () => {
    expect(weekStartUtc(NOW).toISOString()).toBe("2026-10-19T00:00:00.000Z");
    expect(weekStartUtc(new Date("2026-10-19T00:00:00Z")).toISOString()).toBe(
      "2026-10-19T00:00:00.000Z"
    );
    expect(weekStartUtc(new Date("2026-10-25T23:59:00Z")).toISOString()).toBe(
      "2026-10-19T00:00:00.000Z"
    );
  });
});

describe("weeklySignups", () => {
  it("counts per week, oldest first, and drops what's older than the window", () => {
    const weeks = weeklySignups([daysAgo(0), daysAgo(1), daysAgo(7), daysAgo(200)], NOW, 3);
    expect(weeks).toEqual([
      { weekStart: "2026-10-05", count: 0 },
      { weekStart: "2026-10-12", count: 1 },
      { weekStart: "2026-10-19", count: 2 },
    ]);
  });
});

describe("buildUsageSummary", () => {
  const summary = buildUsageSummary({
    now: NOW,
    auth0: "ok",
    stored: [
      { id: "a", createdAt: daysAgo(40), lastSeenAt: daysAgo(0.5), onboardingCompleted: true },
      { id: "b", createdAt: daysAgo(3), lastSeenAt: null, onboardingCompleted: false },
      { id: "c", createdAt: daysAgo(20), lastSeenAt: daysAgo(10), onboardingCompleted: true },
    ],
    auth0Users: [
      {
        id: "b",
        email: "b@example.com",
        name: "B",
        createdAt: daysAgo(3),
        lastLoginAt: daysAgo(2),
        logins: 4,
      },
      // Logged in once, never reached the app.
      {
        id: "d",
        email: "d@example.com",
        name: null,
        createdAt: daysAgo(1),
        lastLoginAt: daysAgo(1),
        logins: 1,
      },
    ],
    counts: new Map([["a", { recurring: 5, transactions: 30, accounts: 2 }]]),
  });

  it("joins both sides into one row per person", () => {
    expect(summary.users.map((u) => u.id).sort()).toEqual(["a", "b", "c", "d"]);
    const b = summary.users.find((u) => u.id === "b")!;
    expect(b.email).toBe("b@example.com");
    expect(b.logins).toBe(4);
    expect(b.counts).toEqual({ recurring: 0, transactions: 0, accounts: 0 });
    expect(summary.users.find((u) => u.id === "a")!.logins).toBeNull();
  });

  it("orders by last activity, the later of last seen and last login", () => {
    expect(summary.users.map((u) => u.id)).toEqual(["a", "d", "b", "c"]);
    expect(summary.users.find((u) => u.id === "b")!.lastActiveAt).toBe(daysAgo(2).toISOString());
  });

  it("counts totals over rolling windows", () => {
    expect(summary.totals).toEqual({
      users: 4,
      onboarded: 2,
      signups7d: 2,
      signups30d: 3,
      dau: 1,
      wau: 3,
      mau: 4,
    });
  });
});
