import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ValuationModal } from "./ValuationModal";

const createInvestmentValuation = jest.fn((_input: unknown) => Promise.resolve());
jest.mock("../../../hooks/useInvestmentValuations", () => ({
  createInvestmentValuation: (input: unknown) => createInvestmentValuation(input),
  updateInvestmentValuation: jest.fn(),
}));

// 1 USD = 10 SEK.
jest.mock("../../../hooks/useExchangeRates", () => ({
  useExchangeRates: () => ({
    rates: { base: "USD", fetchedAt: "2026-10-08", rates: { USD: 1, SEK: 10 } },
    stale: false,
    loading: false,
    error: null,
  }),
}));
jest.mock("../../../hooks/useUserDoc", () => ({
  useUserDoc: () => ({
    userDoc: { mainCurrency: "USD", enabledCurrencies: ["USD", "SEK"] },
    update: jest.fn(),
  }),
}));

const base = {
  open: true,
  selector: { accountId: "acc" },
  name: "Friend loan",
  currency: "USD" as const,
  onClose: jest.fn(),
};

beforeEach(() => createInvestmentValuation.mockClear());

describe("ValuationModal", () => {
  it("opens a debt with no balance on an empty field, the 0 only as placeholder", () => {
    render(<ValuationModal {...base} domain="DEBT" costBasis={70} />);
    const field = screen.getByLabelText("Balance owed") as HTMLInputElement;
    expect(field.value).toBe("");
    expect(field.placeholder).toBe("0");
  });

  it("still prefills a debt's estimated balance", () => {
    render(<ValuationModal {...base} domain="DEBT" costBasis={70} latestValue={1200} />);
    expect((screen.getByLabelText("Balance owed") as HTMLInputElement).value).toBe("1200");
  });

  it("opens an asset with an empty gain and the value on its basis", () => {
    render(<ValuationModal {...base} domain="SAVING" costBasis={1000} />);
    expect((screen.getByLabelText("Gain %") as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText("Current value") as HTMLInputElement).value).toBe("1000");
  });

  it("saves an untouched asset at its basis with a 0% gain", async () => {
    render(<ValuationModal {...base} domain="SAVING" costBasis={1000} />);
    fireEvent.click(screen.getByRole("button", { name: "Record" }));
    await waitFor(() => expect(createInvestmentValuation).toHaveBeenCalled());
    expect(createInvestmentValuation.mock.calls[0][0]).toMatchObject({ value: 1000, gainPct: 0 });
  });

  it("derives the gain from a typed value", async () => {
    render(<ValuationModal {...base} domain="SAVING" costBasis={1000} />);
    fireEvent.change(screen.getByLabelText("Current value"), { target: { value: "1100" } });
    expect((screen.getByLabelText("Gain %") as HTMLInputElement).value).toBe("10");
    fireEvent.click(screen.getByRole("button", { name: "Record" }));
    await waitFor(() => expect(createInvestmentValuation).toHaveBeenCalled());
    expect(createInvestmentValuation.mock.calls[0][0]).toMatchObject({ value: 1100, gainPct: 10 });
  });

  it("asks for the balance when the field is left empty", () => {
    render(<ValuationModal {...base} domain="DEBT" costBasis={70} />);
    fireEvent.click(screen.getByRole("button", { name: "Record" }));
    expect(screen.getByText("Enter the balance owed")).toBeInTheDocument();
    expect(createInvestmentValuation).not.toHaveBeenCalled();
  });

  it("says why there's no gain % when nothing has been paid in", () => {
    render(<ValuationModal {...base} domain="INVESTMENT" costBasis={0} />);
    expect(screen.queryByLabelText("Gain %")).not.toBeInTheDocument();
    expect(screen.getByText(/Nothing has been paid into this account yet/)).toBeInTheDocument();
  });

  it("records in another currency, the basis and the typed value converted", async () => {
    render(<ValuationModal {...base} domain="INVESTMENT" costBasis={100} />);
    fireEvent.change(screen.getByLabelText("Current value"), { target: { value: "110" } });
    fireEvent.change(screen.getByLabelText("Currency"), { target: { value: "SEK" } });
    expect((screen.getByLabelText("Current value") as HTMLInputElement).value).toBe("1100");
    expect((screen.getByLabelText("Gain %") as HTMLInputElement).value).toBe("10");

    fireEvent.click(screen.getByRole("button", { name: "Record" }));
    await waitFor(() => expect(createInvestmentValuation).toHaveBeenCalled());
    expect(createInvestmentValuation.mock.calls[0][0]).toMatchObject({
      value: 1100,
      gainPct: 10,
      costBasis: 1000,
      currency: "SEK",
    });
  });
});
