import {
  calendarMonthsBetween,
  debtValueAt,
  estimateWithInterest,
  grow,
  interestAccrued,
  monthlyRate,
  monthsBetween,
  valueAt,
  wholeMonthsBetween,
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

  it("passes a monthly quote through and reads a yearly one as nominal", () => {
    expect(monthlyRate({ value: 1, period: "MONTHLY" })).toBeCloseTo(0.01, 10);
    expect(monthlyRate({ value: 12, period: "YEARLY" })).toBeCloseTo(0.01, 10);
  });

  it("matches a bank statement's monthly interest", () => {
    // SEB: 606,673 at 2.85% yearly → 1,441 of interest a month.
    const r = monthlyRate({ value: 2.85, period: "YEARLY" });
    expect(606673 * r).toBeCloseTo(1440.85, 2);
  });
});

describe("monthsBetween / grow", () => {
  it("measures fractional months and never goes negative", () => {
    expect(monthsBetween(jan, nextJan)).toBeCloseTo(12, 1);
    expect(monthsBetween(jan, feb)).toBeCloseTo(1.02, 1);
    expect(monthsBetween(feb, jan)).toBe(0);
  });

  it("counts whole calendar days, ignoring the time of day", () => {
    const noon = new Date(2026, 9, 5, 12);
    expect(monthsBetween(noon, new Date(2026, 9, 5, 19, 30))).toBe(0);
    expect(monthsBetween(noon, new Date(2026, 9, 6, 0, 5))).toBeCloseTo(1 / 30.436875, 10);
  });

  it("compounds monthly; a nominal yearly quote earns slightly more than itself", () => {
    const r = monthlyRate({ value: 5, period: "YEARLY" });
    expect(grow(1000, r, jan, nextJan)).toBeCloseTo(1051.16, 0);
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
    expect(-valueAt(repayments, balance, rate, apr)).toBeCloseTo(4134.5, 0);
    // Without a rate the balance simply shrinks by what was repaid.
    expect(-valueAt(repayments, balance, undefined, apr)).toBe(4000);
  });

  it("interestAccrued is what repayments did not explain since the first balance", () => {
    // Feb 1: 5,000 + 50 − 500 = 4,550. Mar 1: 4,550 + 45.50 − 500 = 4,095.50.
    // Apr 1: a whole month with nothing paid adds its 40.955.
    const owed = 4095.5 * 1.01;
    expect(-debtValueAt(repayments, balance, rate, apr)).toBeCloseTo(owed, 6);
    expect(interestAccrued(repayments, balance, rate, apr)).toBeCloseTo(owed - 5000 + 1000, 6);
    expect(interestAccrued(repayments, balance, undefined, apr)).toBe(0);
  });

  it("reads a balance exactly as entered on the day it was recorded", () => {
    const monthly = { value: 2.85, period: "MONTHLY" as const };
    const checks = [{ value: -606673, asOf: new Date(2026, 9, 5, 12) }];
    const evening = new Date(2026, 9, 5, 19, 30);
    expect(-valueAt([], checks, monthly, evening)).toBe(606673);
    expect(interestAccrued([], checks, monthly, evening)).toBe(0);
    // The next day, one day of interest.
    const nextDay = new Date(2026, 9, 6, 9);
    expect(-valueAt([], checks, monthly, nextDay)).toBeCloseTo(
      606673 * Math.pow(1.0285, 1 / 30.436875),
      6
    );
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

describe("interestAccrued with money borrowed", () => {
  it("counts a draw as balance that repayments did not explain — not as interest", () => {
    // Owed 5,000 on Jan 1; borrowed 300 more in Feb; repaid 500 in Mar; owed 5,000 on Apr 1.
    const checks = [
      { value: -5000, asOf: jan },
      { value: -5000, asOf: new Date(2026, 3, 1) },
    ];
    const deposits = [
      { amount: -300, at: feb },
      { amount: 500, at: new Date(2026, 2, 1) },
    ];
    expect(interestAccrued(deposits, checks, undefined, new Date(2026, 3, 1))).toBe(200);
  });
});

describe("calendar months", () => {
  it("counts due date to due date as exactly one month", () => {
    expect(calendarMonthsBetween(new Date(2026, 9, 28), new Date(2026, 10, 28))).toBe(1);
    expect(calendarMonthsBetween(new Date(2026, 1, 1), new Date(2026, 2, 1))).toBe(1);
    expect(calendarMonthsBetween(new Date(2026, 9, 5), new Date(2026, 9, 28))).toBeCloseTo(
      23 / 31,
      10
    );
    expect(wholeMonthsBetween(new Date(2026, 9, 28), new Date(2026, 10, 27))).toBe(0);
    expect(wholeMonthsBetween(new Date(2026, 9, 28), new Date(2026, 10, 28, 9))).toBe(1);
    expect(wholeMonthsBetween(new Date(2026, 0, 31), new Date(2026, 1, 28))).toBe(1);
    expect(calendarMonthsBetween(new Date(2026, 10, 5), new Date(2026, 9, 5))).toBe(0);
  });
});

describe("debtValueAt — an amortising bank loan", () => {
  // SEB loan 48388280: 606,673 owed when checked on Oct 5, 2.85% yearly,
  // 2,504 paid on Oct 28. The bank shows 605,610 afterwards, and its Nov 28
  // payment is 1,063 off the balance plus 1,438 of interest.
  const rate = { value: 2.85, period: "YEARLY" as const };
  const checks = [{ value: -606673, asOf: new Date(2026, 9, 5, 12) }];
  const paidOct = { amount: 2504, at: new Date(2026, 9, 28, 12) };

  it("lands on the bank's balance after a payment", () => {
    const owed = -debtValueAt([paidOct], checks, rate, new Date(2026, 10, 5, 18));
    expect(owed).toBeCloseTo(605609.85, 2);
  });

  it("holds still between payments, as the bank shows it", () => {
    const before = new Date(2026, 9, 27);
    expect(-debtValueAt([paidOct], checks, rate, before)).toBe(606673);
    const owedNov5 = -debtValueAt([paidOct], checks, rate, new Date(2026, 10, 5));
    const owedNov27 = -debtValueAt([paidOct], checks, rate, new Date(2026, 10, 27));
    expect(owedNov27).toBe(owedNov5);
  });

  it("charges the next payment one month of interest on the new balance", () => {
    const paidNov = { amount: 2501, at: new Date(2026, 10, 28, 12) };
    const owed = -debtValueAt([paidOct, paidNov], checks, rate, new Date(2026, 10, 29));
    // 605,609.85 + 1,438.32 − 2,501 = 604,547.17 — 1,063 off, as SEB plans it.
    expect(owed).toBeCloseTo(604547.17, 2);
  });

  it("adds a month's interest only once a whole month passes unpaid", () => {
    const r = monthlyRate(rate);
    expect(-debtValueAt([], checks, rate, new Date(2026, 10, 4))).toBe(606673);
    expect(-debtValueAt([], checks, rate, new Date(2026, 10, 5))).toBeCloseTo(606673 * (1 + r), 6);
  });

  it("adds money borrowed without settling interest", () => {
    const draw = { amount: -1000, at: new Date(2026, 9, 10) };
    const owed = -debtValueAt([draw, paidOct], checks, rate, new Date(2026, 10, 5));
    expect(owed).toBeCloseTo(607673 * (1 + monthlyRate(rate)) - 2504, 6);
  });

  it("is just the balance less repayments without a rate", () => {
    expect(-debtValueAt([paidOct], checks, undefined, new Date(2026, 10, 5))).toBe(604169);
  });
});
