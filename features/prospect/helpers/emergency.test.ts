import {
  balanceSeries,
  chartHorizon,
  emergencyBudget,
  emergencyProjection,
  planInTarget,
  runwayMonths,
} from "./emergency";
import type { RunwayInput } from "./emergency";
import type { RankedItem } from "./rankCancelable";
import type { RecurrentTransaction } from "../../../types";

const base: RunwayInput = {
  cushion: 10_000,
  burnMonthly: 2_000,
  benefitMonthly: 0,
  benefitMonths: 0,
  severance: 0,
};

const ranked = (monthly: number): RankedItem => ({
  item: { name: "x" } as RecurrentTransaction,
  monthly,
  essential: true,
  guessed: false,
});

describe("emergencyBudget", () => {
  it("burns essentials and debt, and pauses the rest", () => {
    const budget = emergencyBudget({
      essential: [ranked(1_000), ranked(500)],
      debts: [ranked(300)],
      nonEssential: [ranked(50), ranked(20)],
      contributions: [ranked(400)],
    });
    expect(budget).toEqual({
      essentialMonthly: 1_500,
      debtMonthly: 300,
      burnMonthly: 1_800,
      pausedSpending: 70,
      pausedContributions: 400,
      fullMonthly: 2_270,
    });
  });
});

describe("runwayMonths", () => {
  it("divides the cushion by the burn when nothing else comes in", () => {
    expect(runwayMonths(base)).toBe(5);
    expect(runwayMonths({ ...base, cushion: 9_000 })).toBe(4.5);
  });

  it("stretches while a benefit pays, then burns at full rate", () => {
    // 6 months at 2000 − 1500 = 500/mo → 3000 used, 7000 left at full burn → 3.5 more.
    expect(runwayMonths({ ...base, benefitMonthly: 1_500, benefitMonths: 6 })).toBe(9.5);
  });

  it("lets a benefit larger than the burn top the cushion up", () => {
    // +500 for 4 months → 12 000, then 6 months at 2000.
    expect(runwayMonths({ ...base, benefitMonthly: 2_500, benefitMonths: 4 })).toBe(10);
  });

  it("counts the severance as cash on day one", () => {
    expect(runwayMonths({ ...base, cushion: 0, severance: 4_000 })).toBe(2);
  });

  it("is zero with no cushion and something to pay", () => {
    expect(runwayMonths({ ...base, cushion: 0 })).toBe(0);
  });

  it("is null when nothing is spent, or when it outlasts the cap", () => {
    expect(runwayMonths({ ...base, burnMonthly: 0 })).toBeNull();
    expect(runwayMonths({ ...base, cushion: 1_000_000 })).toBeNull();
    expect(runwayMonths(base, 3)).toBeNull();
  });
});

describe("balanceSeries", () => {
  it("starts today with the severance in and never dips below zero", () => {
    expect(balanceSeries({ ...base, cushion: 3_000, severance: 1_000 }, 3)).toEqual([
      4_000, 2_000, 0, 0,
    ]);
  });
});

describe("chartHorizon", () => {
  it("shows a couple of months past the runway, within bounds", () => {
    expect(chartHorizon(1)).toBe(6);
    expect(chartHorizon(8.2)).toBe(11);
    expect(chartHorizon(200)).toBe(60);
    expect(chartHorizon(null)).toBe(24);
  });
});

describe("emergencyProjection", () => {
  it("pairs the keep-everything line with the emergency one, from now", () => {
    const points = emergencyProjection(
      { ...base, burnMonthly: 5_000 },
      base,
      2,
      new Date(2026, 9, 3)
    );
    expect(points.map((p) => p.label)).toEqual(["Now", "Nov", "Dec"]);
    expect(points.map((p) => [p.income, p.expense])).toEqual([
      [10_000, 10_000],
      [5_000, 8_000],
      [0, 6_000],
    ]);
  });
});

describe("planInTarget", () => {
  it("converts the benefit and severance, and keeps the months", () => {
    const ctx = { rates: { base: "USD", rates: { USD: 1, EUR: 0.5 } }, target: "USD" } as never;
    expect(
      planInTarget(
        {
          currency: "EUR",
          benefitMonthly: 500,
          benefitMonths: 6,
          severance: 1_000,
          includeInvestments: false,
        },
        ctx
      )
    ).toEqual({ benefitMonthly: 1_000, benefitMonths: 6, severance: 2_000 });
  });
});
