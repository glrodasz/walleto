import { currencyOptions, enabledCurrencies, toggleCurrency } from "./currencies";

describe("enabledCurrencies", () => {
  it("falls back to USD / EUR / GBP when the user never chose", () => {
    expect(enabledCurrencies(undefined)).toEqual(["USD", "EUR", "GBP"]);
    expect(enabledCurrencies([])).toEqual(["USD", "EUR", "GBP"]);
  });

  it("returns the chosen list in catalog order", () => {
    expect(enabledCurrencies(["JPY", "MXN", "USD"])).toEqual(["USD", "MXN", "JPY"]);
  });

  it("folds in the pinned currencies without duplicating them", () => {
    expect(enabledCurrencies(["USD"], "SEK", "USD")).toEqual(["USD", "SEK"]);
  });

  it("ignores blank pins and anything outside the catalog", () => {
    expect(enabledCurrencies(["USD"], undefined, "")).toEqual(["USD"]);
    expect(enabledCurrencies(["XYZ" as never, "EUR"])).toEqual(["EUR"]);
  });
});

describe("currencyOptions", () => {
  it("labels each option with its symbol", () => {
    expect(currencyOptions(["USD", "GBP"])).toEqual([
      { value: "USD", label: "$ USD" },
      { value: "GBP", label: "£ GBP" },
    ]);
  });
});

describe("toggleCurrency", () => {
  it("adds a currency in catalog order", () => {
    expect(toggleCurrency(["USD", "GBP"], "EUR")).toEqual(["USD", "EUR", "GBP"]);
  });

  it("removes one that is already on", () => {
    expect(toggleCurrency(["USD", "EUR", "GBP"], "EUR")).toEqual(["USD", "GBP"]);
  });

  it("can empty the list — the caller decides whether that is allowed", () => {
    expect(toggleCurrency(["USD"], "USD")).toEqual([]);
  });
});
