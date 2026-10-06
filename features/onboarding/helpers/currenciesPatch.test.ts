import { currenciesPatch } from "./currenciesPatch";

describe("currenciesPatch", () => {
  it("writes nothing when nothing changed", () => {
    expect(currenciesPatch({ mainCurrency: "USD" }, "USD", null)).toBeNull();
  });

  it("moves the main and the display currency together", () => {
    expect(currenciesPatch({ mainCurrency: "USD" }, "COP", null)).toEqual({
      mainCurrency: "COP",
      displayCurrency: "COP",
    });
  });

  it("realigns a display currency the header left elsewhere", () => {
    expect(currenciesPatch({ mainCurrency: "COP", displayCurrency: "USD" }, "COP", null)).toEqual({
      displayCurrency: "COP",
    });
  });

  it("saves the offered currencies only once they were picked", () => {
    expect(currenciesPatch({ mainCurrency: "COP" }, "COP", ["USD", "EUR", "COP"])).toEqual({
      enabledCurrencies: ["USD", "EUR", "COP"],
    });
    expect(
      currenciesPatch({ mainCurrency: "COP", enabledCurrencies: ["USD", "COP"] }, "COP", [
        "USD",
        "COP",
      ])
    ).toBeNull();
  });

  it("works before the user doc has loaded", () => {
    expect(currenciesPatch(null, "USD", null)).toEqual({
      mainCurrency: "USD",
      displayCurrency: "USD",
    });
  });
});
