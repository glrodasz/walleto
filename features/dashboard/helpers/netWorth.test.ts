import { netWorth } from "./netWorth";
import type { PositionPart } from "./netWorth";

const part = (over: Partial<PositionPart> = {}): PositionPart => ({
  value: 0,
  hasRows: false,
  lastCheckedAt: null,
  estimated: false,
  ...over,
});

describe("netWorth", () => {
  it("adds what the accounts are worth and subtracts what the debts owe", () => {
    const result = netWorth({
      investments: part({ value: 10_000, hasRows: true, lastCheckedAt: new Date(2026, 8, 1) }),
      savings: part({ value: 2_500, hasRows: true, lastCheckedAt: new Date(2026, 8, 12) }),
      debts: part({ value: 4_000, hasRows: true, lastCheckedAt: new Date(2026, 7, 30) }),
    });
    expect(result).toMatchObject({
      investments: 10_000,
      savings: 2_500,
      debts: 4_000,
      net: 8_500,
      debtsUnknown: false,
      empty: false,
    });
    expect(result.lastCheckedAt).toEqual(new Date(2026, 8, 12));
  });

  it("leaves out a debt whose balance was never recorded, and says so", () => {
    const result = netWorth({
      investments: part({ value: 1_000, hasRows: true, lastCheckedAt: new Date(2026, 8, 1) }),
      savings: part(),
      // Repayments only: the helper must not treat 0 owed as known.
      debts: part({ value: 0, hasRows: true }),
    });
    expect(result.net).toBe(1_000);
    expect(result.debts).toBe(0);
    expect(result.debtsUnknown).toBe(true);
  });

  it("goes negative when the debts outweigh the assets", () => {
    const result = netWorth({
      investments: part(),
      savings: part({ value: 500, hasRows: true, lastCheckedAt: new Date(2026, 8, 1) }),
      debts: part({ value: 2_000, hasRows: true, lastCheckedAt: new Date(2026, 8, 1) }),
    });
    expect(result.net).toBe(-1_500);
  });

  it("flags an interest estimate and an empty profile", () => {
    expect(
      netWorth({
        investments: part({ value: 1_050, hasRows: true, estimated: true }),
        savings: part(),
        debts: part(),
      }).estimated
    ).toBe(true);
    expect(netWorth({ investments: part(), savings: part(), debts: part() }).empty).toBe(true);
  });
});
