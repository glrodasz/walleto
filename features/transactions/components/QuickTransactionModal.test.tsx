import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QuickTransactionModal } from "./QuickTransactionModal";
import { anchorStartDate, toDateInputValue } from "../../../helpers/scheduleAnchor";

const createCategory = jest.fn();
let categories: unknown[] = [];
jest.mock("../../../hooks/useCategories", () => ({
  useCategories: () => ({ categories, loading: false, error: null, create: createCategory }),
}));
jest.mock("../../../hooks/usePaymentMethods", () => ({
  usePaymentMethods: () => ({
    methods: [
      {
        id: "m1",
        name: "Revolut",
        type: "DIGITAL_WALLET",
        currencies: ["EUR"],
        defaultCurrency: "EUR",
      },
    ],
  }),
}));
jest.mock("../../../hooks/useUserDoc", () => ({
  useUserDoc: () => ({ userDoc: { mainCurrency: "USD" } }),
}));

const fetchMock = jest.fn();
global.fetch = fetchMock as unknown as typeof fetch;

beforeEach(() => {
  fetchMock.mockReset();
  createCategory.mockReset();
  categories = [{ id: "c1", userId: "u", domain: "EXPENSE", name: "Groceries", archived: false }];
});

function fill(name: string, amount: string) {
  fireEvent.change(screen.getByLabelText("Category"), { target: { value: "c1" } });
  fireEvent.change(screen.getByLabelText("Name"), { target: { value: name } });
  fireEvent.change(screen.getByLabelText("Amount"), { target: { value: amount } });
}

describe("QuickTransactionModal", () => {
  it("defaults to today and posts a PAID transaction at local noon", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ id: "t1" }) });
    const onClose = jest.fn();
    render(<QuickTransactionModal open domain="EXPENSE" onClose={onClose} />);

    expect(screen.getByRole("dialog", { name: "Record a payment" })).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Type" })).toBeNull();
    const today = toDateInputValue(new Date());
    expect(screen.getByLabelText("Date")).toHaveValue(today);

    fill("Bread", "12.5");
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toEqual({
      domain: "EXPENSE",
      categoryId: "c1",
      name: "Bread",
      amount: 12.5,
      currency: "USD",
      occurredAt: anchorStartDate({ frequency: "ONE_TIME", date: today }).toISOString(),
      status: "PAID",
    });
  });

  it("takes the currency from the chosen payment method and sends the method id", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ id: "t1" }) });
    render(<QuickTransactionModal open domain="EXPENSE" onClose={jest.fn()} />);

    fill("Coffee", "3");
    fireEvent.change(screen.getByLabelText("Payment method"), { target: { value: "m1" } });
    expect(screen.getByLabelText("Currency")).toHaveValue("EUR");
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.currency).toBe("EUR");
    expect(body.paymentMethodId).toBe("m1");
  });

  it("blocks an empty amount and surfaces a failed save", async () => {
    render(<QuickTransactionModal open domain="EXPENSE" onClose={jest.fn()} />);
    fill("Bread", "0");
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Amount must be greater than zero");
    expect(fetchMock).not.toHaveBeenCalled();

    jest.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockResolvedValue({ ok: false, text: async () => "Category domain mismatch" });
    fill("Bread", "5");
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Couldn't save"));
  });

  it("lets the user pick the domain when the page has none", () => {
    render(<QuickTransactionModal open onClose={jest.fn()} />);
    expect(screen.getByRole("dialog", { name: "Record a payment" })).toBeInTheDocument();
    const group = screen.getByRole("group", { name: "Type" });
    expect(group).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Income" }));
    expect(screen.getByRole("dialog", { name: "Record an income" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Income" })).toHaveAttribute("aria-pressed", "true");
  });
});
