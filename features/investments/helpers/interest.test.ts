import {
  estimateWithInterest,
  grow,
  interestAccrued,
  monthlyRate,
  monthsBetween,
  valueAt,
} from "./interest";

const jan = new Date(2026, 0, 1);
const feb = new Date(2026, 1, 1);
const jul = new Date(2026, 6, 1);
const nextJan = new Date(2027, 0, 1);

describe("monthlyRate", () => {
  it("is zero without a rate", () => {
    expect(monthlyRate(undefined)).toBe(0);
    expect(monthlyRate(null)).toBe(0);
    expect(monthlyRate({ value: 0, period: "MONTHLY" })).toBe(0);
  });

  it("passes a monthly quote through and de-compounds a yearly one", () => {
    expect(monthlyRate({ value: 1, period: "MONTHLY" })).toBeCloseTo(0.01, 10);
    // 12.68% effective yearly ≈ 1% monthly
    expect(monthlyRate({ value: 12.6825, period: "YEARLY" })).toBeCloseTo(0.01, 4);
  });
});

describe("monthsBetween / grow", () => {
  it("measures fractional months and never goes negative", () => {
    expect(monthsBetween(jan, nextJan)).toBeCloseTo(12, 1);
    expect(monthsBetween(jan, feb)).toBeCloseTo(1.02, 1);
    expect(monthsBetween(feb, jan)).toBe(0);
  });

  it("compounds monthly; a yearly quote lands on itself after a year", () => {
    const r = monthlyRate({ value: 5, period: "YEARLY" });
    expect(grow(1000, r, jan, nextJan)).toBeCloseTo(1050, 0);
    expect(grow(1000, 0, jan, nextJan)).toBe(1000);
  });
});

describe("estimateWithInterest", () => {
  it("grows each deposit from its own date and ignores later ones", () => {
    const r = monthlyRate({ value: 12, period: "YEARLY" });
    const deposits = [
      { amount: 1000, at: jan },
      { amount: 1000, at: jul },
      { amount: 1000, at: nextJan },
    ];
    const asOf = new Date(2026, 11, 31);
    const expected = grow(1000, r, jan, asOf) + grow(1000, r, jul, asOf);
    expect(estimateWithInterest(deposits, r, asOf)).toBeCloseTo(expected, 6);
    expect(estimateWithInterest(deposits, 0, asOf)).toBe(2000);
  });
});

describe("valueAt", () => {
  const rate = { value: 12, period: "YEARLY" as const };
  const deposits = [
    { amount: 1000, at: jan },
    { amount: 500, at: jul },
  ];

  it("is the interest estimate when nothing has been recorded", () => {
    expect(valueAt(deposits, [], rate, feb)).toBeCloseTo(
      grow(1000, monthlyRate(rate), jan, feb),
      6
    );
    expect(valueAt(deposits, [], undefined, nextJan)).toBe(1500);
  });

  it("takes over from a value check and keeps compounding it plus later deposits", () => {
    const checks = [{ value: 1100, asOf: new Date(2026, 5, 1) }];
    const r = monthlyRate(rate);
    const asOf = new Date(2026, 8, 1);
    const expected = grow(1100, r, checks[0].asOf, asOf) + grow(500, r, jul, asOf);
    expect(valueAt(deposits, checks, rate, asOf)).toBeCloseTo(expected, 6);
  });

  it("ignores checks dated after asOf and picks the newest of the rest", () => {
    const checks = [
      { value: 900, asOf: new Date(2026, 2, 1) },
      { value: 1200, asOf: new Date(2026, 4, 1) },
      { value: 5000, asOf: new Date(2026, 9, 1) },
    ];
    expect(valueAt(deposits, checks, undefined, new Date(2026, 5, 1))).toBe(1200);
    expect(valueAt(deposits, checks, undefined, nextJan)).toBe(5000);
  });
});

describe("a debt as a negative position", () => {
  // 5,000 owed on Jan 1 at 12% yearly, 500 repaid on Feb 1 and on Mar 1.
  const rate = { value: 12, period: "YEARLY" as const };
  const mar = new Date(2026, 2, 1);
  const apr = new Date(2026, 3, 1);
  const repayments = [
    { amount: 500, at: feb },
    { amount: 500, at: mar },
  ];
  const balance = [{ value: -5000, asOf: jan }];

  it("valueAt compounds the balance up and each repayment down", () => {
    const r = monthlyRate(rate);
    const owed = grow(5000, r, jan, apr) - grow(500, r, feb, apr) - grow(500, r, mar, apr);
    expect(-valueAt(repayments, balance, rate, apr)).toBeCloseTo(owed, 6);
    // Roughly 4,000 of principal plus a quarter's interest on it (mean-month exponents).
    expect(-valueAt(repayments, balance, rate, apr)).toBeCloseTo(4127.5, 0);
    // Without a rate the balance simply shrinks by what was repaid.
    expect(-valueAt(repayments, balance, undefined, apr)).toBe(4000);
  });

  it("interestAccrued is what repayments did not explain since the first balance", () => {
    const r = monthlyRate(rate);
    const owed = grow(5000, r, jan, apr) - grow(500, r, feb, apr) - grow(500, r, mar, apr);
    expect(interestAccrued(repayments, balance, rate, apr)).toBeCloseTo(owed - 5000 + 1000, 6);
    expect(interestAccrued(repayments, balance, undefined, apr)).toBe(0);
  });

  it("interestAccrued measures from the first balance, through later checks", () => {
    // A second check of 5,100 on Apr 1 after 1,000 repaid: 1,100 of interest and charges.
    const checks = [...balance, { value: -5100, asOf: apr }];
    expect(interestAccrued(repayments, checks, undefined, apr)).toBe(1100);
    // Nothing to measure before any balance exists.
    expect(interestAccrued(repayments, checks, rate, new Date(2025, 11, 1))).toBeNull();
    expect(interestAccrued(repayments, [], rate, apr)).toBeNull();
  });
});
