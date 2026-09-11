import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MethodsSettings } from "./MethodsSettings";

const save = jest.fn();
const reset = jest.fn();
const remove = jest.fn().mockResolvedValue(undefined);

jest.mock("../../onboarding/hooks/useMethodsStep", () => ({
  useMethodsStep: () => ({ save, reset }),
}));
jest.mock("../../onboarding/components/MethodsStep", () => ({
  MethodsStep: () => <div data-testid="methods-step" />,
}));
jest.mock("../../methods/components/EditMethodModal", () => ({
  EditMethodModal: () => null,
}));
jest.mock("../../../hooks/usePaymentMethods", () => ({
  usePaymentMethods: () => ({
    methods: [{ id: "m1", name: "Visa", type: "CREDIT_CARD", currencies: ["USD"] }],
    loading: false,
    remove,
  }),
}));

beforeEach(() => {
  save.mockReset();
  reset.mockReset();
  remove.mockClear();
});

describe("MethodsSettings", () => {
  it("saves new rows and resets the form when something was created", async () => {
    save.mockResolvedValue(2);
    render(<MethodsSettings />);
    expect(screen.getByTestId("methods-step")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(screen.getByText("Saved 2 new methods")).toBeInTheDocument());
    expect(reset).toHaveBeenCalled();
  });

  it("reports a failed save and keeps the draft", async () => {
    save.mockRejectedValue(new Error("boom"));
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    render(<MethodsSettings />);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(screen.getByText("Couldn't save — try again")).toBeInTheDocument());
    expect(reset).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("archives a saved method through its menu", async () => {
    render(<MethodsSettings />);
    fireEvent.click(screen.getByRole("button", { name: "Actions for Visa" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Archive" }));
    await waitFor(() => expect(remove).toHaveBeenCalledWith("m1"));
  });
});
