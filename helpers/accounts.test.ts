import {
  ACCOUNT_NOUN,
  accountLabel,
  formatInterestRate,
  isAccountDomain,
  sortAccountsByLabel,
} from "./accounts";

describe("isAccountDomain", () => {
  it("is true for investments and savings only", () => {
    expect(isAccountDomain("INVESTMENT")).toBe(true);
    expect(isAccountDomain("SAVING")).toBe(true);
    expect(isAccountDomain("INCOME")).toBe(false);
    expect(isAccountDomain("EXPENSE")).toBe(false);
  });

  it("names them differently", () => {
    expect(ACCOUNT_NOUN.INVESTMENT.singular).toBe("account");
    expect(ACCOUNT_NOUN.SAVING.singular).toBe("pocket");
  });
});

describe("formatInterestRate", () => {
  it("keeps whole numbers short and rounds the rest to two decimals", () => {
    expect(formatInterestRate({ value: 3, period: "YEARLY" })).toBe("3% yearly");
    expect(formatInterestRate({ value: 2.5, period: "YEARLY" })).toBe("2.5% yearly");
    expect(formatInterestRate({ value: 0.4167, period: "MONTHLY" })).toBe("0.42% monthly");
  });
});

describe("accountLabel / sortAccountsByLabel", () => {
  it("prefixes the bank or broker when there is one", () => {
    expect(accountLabel({ name: "ISK", provider: "Avanza" })).toBe("Avanza - ISK");
    expect(accountLabel({ name: "Emergency fund" })).toBe("Emergency fund");
  });

  it("sorts by label, case-insensitively, without mutating the input", () => {
    const input = [{ name: "zeta" }, { name: "Alpha", provider: "SEB" }, { name: "beta" }];
    const out = sortAccountsByLabel(input);
    expect(out.map(accountLabel)).toEqual(["beta", "SEB - Alpha", "zeta"]);
    expect(input[0].name).toBe("zeta");
  });
});
