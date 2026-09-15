import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { CurrencyCard } from "./CurrencyCard";
import type { UserDoc } from "../../../hooks/useUserDoc";

const update = jest.fn().mockResolvedValue(undefined);
const setDisplayCurrency = jest.fn().mockResolvedValue(undefined);
let userDoc: Partial<UserDoc>;
let target = "USD";

jest.mock("../../../hooks/useUserDoc", () => ({
  useUserDoc: () => ({ userDoc, update }),
}));
jest.mock("../../../hooks/useMoneyContext", () => ({
  useMoneyContext: () => ({ target, setDisplayCurrency }),
}));

/** The toggle for one currency, found by the code in its label ("$ USD"). */
const chip = (code: string) => {
  const group = screen.getByLabelText("Available currencies");
  const label = within(group).getByText(new RegExp(`${code}$`), { selector: "span.text" });
  return label.closest("button") as HTMLButtonElement;
};

const optionCodes = (label: string) =>
  Array.from((screen.getByLabelText(label) as HTMLSelectElement).options).map((o) => o.value);

beforeEach(() => {
  update.mockClear();
  setDisplayCurrency.mockClear();
  userDoc = { mainCurrency: "USD" };
  target = "USD";
});

describe("CurrencyCard", () => {
  it("starts on USD / EUR / GBP and offers only those in the selects", () => {
    render(<CurrencyCard />);
    expect(chip("USD")).toHaveAttribute("aria-pressed", "true");
    expect(chip("EUR")).toHaveAttribute("aria-pressed", "true");
    expect(chip("GBP")).toHaveAttribute("aria-pressed", "true");
    expect(chip("JPY")).toHaveAttribute("aria-pressed", "false");
    expect(optionCodes("Main currency")).toEqual(["USD", "EUR", "GBP"]);
    expect(optionCodes("Display currency")).toEqual(["USD", "EUR", "GBP"]);
  });

  it("turns a currency on, saving the list on the user doc", async () => {
    render(<CurrencyCard />);
    fireEvent.click(chip("SEK"));
    await waitFor(() =>
      expect(update).toHaveBeenCalledWith({ enabledCurrencies: ["USD", "EUR", "GBP", "SEK"] })
    );
  });

  it("turns one off again", async () => {
    userDoc = { mainCurrency: "USD", enabledCurrencies: ["USD", "EUR", "GBP", "SEK"] };
    render(<CurrencyCard />);
    fireEvent.click(chip("EUR"));
    await waitFor(() =>
      expect(update).toHaveBeenCalledWith({ enabledCurrencies: ["USD", "GBP", "SEK"] })
    );
  });

  it("locks the main and display currencies on", () => {
    userDoc = { mainCurrency: "MXN", displayCurrency: "SEK", enabledCurrencies: ["USD"] };
    target = "SEK";
    render(<CurrencyCard />);

    expect(chip("MXN")).toBeDisabled();
    expect(chip("SEK")).toBeDisabled();
    expect(chip("USD")).toBeEnabled();
    // Both are folded into the pickers even though only USD was chosen.
    expect(optionCodes("Main currency")).toEqual(["USD", "MXN", "SEK"]);
  });

  it("keeps a disabled currency in the select that already holds it", () => {
    userDoc = { mainCurrency: "JPY", enabledCurrencies: ["USD", "EUR"] };
    render(<CurrencyCard />);
    expect(optionCodes("Main currency")).toEqual(["USD", "EUR", "JPY"]);
  });
});
