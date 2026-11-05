import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DraftModal } from "./DraftModal";

const createDraft = jest.fn().mockResolvedValue("dr1");

jest.mock("../../../hooks/useUserDoc", () => ({
  useUserDoc: () => ({ userDoc: { mainCurrency: "USD" } }),
}));
jest.mock("../hooks/useExpenseDrafts", () => ({
  createDraft: (...args: unknown[]) => createDraft(...args),
}));

beforeEach(() => createDraft.mockClear());

describe("DraftModal", () => {
  it("saves a draft with nothing but a name", async () => {
    const onClose = jest.fn();
    render(<DraftModal open onClose={onClose} />);
    fireEvent.change(screen.getByLabelText("What is it?"), { target: { value: " Netflix " } });
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(createDraft).toHaveBeenCalledWith({ name: "Netflix" });
  });

  it("asks for a name first", () => {
    render(<DraftModal open onClose={jest.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    expect(screen.getByText("Give it a name")).toBeInTheDocument();
    expect(createDraft).not.toHaveBeenCalled();
  });

  it("sends the amount, the cadence and the payment day when known", async () => {
    render(<DraftModal open onClose={jest.fn()} />);
    fireEvent.change(screen.getByLabelText("What is it?"), { target: { value: "Gym" } });
    fireEvent.change(screen.getByLabelText("Amount (optional)"), { target: { value: "39,90" } });
    fireEvent.click(screen.getByRole("radio", { name: "Monthly" }));
    fireEvent.change(screen.getByLabelText("Payment day (optional)"), { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    await waitFor(() => expect(createDraft).toHaveBeenCalled());
    expect(createDraft).toHaveBeenCalledWith({
      name: "Gym",
      amount: 39.9,
      currency: "USD",
      frequency: "MONTHLY",
      dayOfMonth: 3,
    });
  });

  it("asks for a date on a yearly draft", async () => {
    render(<DraftModal open onClose={jest.fn()} />);
    fireEvent.change(screen.getByLabelText("What is it?"), { target: { value: "Domain" } });
    fireEvent.click(screen.getByRole("radio", { name: "Yearly" }));
    fireEvent.change(screen.getByLabelText("Date (optional)"), { target: { value: "2027-02-14" } });
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    await waitFor(() => expect(createDraft).toHaveBeenCalled());
    expect(createDraft).toHaveBeenCalledWith({
      name: "Domain",
      frequency: "YEARLY",
      date: "2027-02-14",
    });
  });
});
