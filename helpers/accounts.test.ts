import { ACCOUNT_NOUN, formatInterestRate, isAccountDomain, sortAccountsByName } from "./accounts";

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
    expect(formatInterestRate({ value: 0.4167, period: "MONTHLY" })).toBe("0.42% monthly");
  });
});

describe("sortAccountsByName", () => {
  it("sorts case-insensitively without mutating the input", () => {
    const input = [{ name: "zeta" }, { name: "Alpha" }, { name: "beta" }];
    const out = sortAccountsByName(input);
    expect(out.map((a) => a.name)).toEqual(["Alpha", "beta", "zeta"]);
    expect(input[0].name).toBe("zeta");
  });
});
