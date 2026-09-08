import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PaymentMethodField } from "./PaymentMethodField";
import type { PaymentMethod } from "../../types";

const methods = [
  { id: "m1", userId: "u", name: "Chase", type: "CREDIT_CARD", last4: "4242", currencies: ["USD"] },
] as unknown as PaymentMethod[];

function setup(createMethod = jest.fn().mockResolvedValue("new1")) {
  const onChange = jest.fn();
  const onError = jest.fn();
  render(
    <PaymentMethodField
      methods={methods}
      value=""
      onChange={onChange}
      createMethod={createMethod}
      onError={onError}
    />
  );
  return { onChange, onError, createMethod };
}

describe("PaymentMethodField", () => {
  it("lists methods with their full label and selects one", () => {
    const { onChange } = setup();
    const select = screen.getByLabelText("Payment method") as HTMLSelectElement;
    const labels = Array.from(select.options).map((o) => o.textContent ?? "");
    expect(labels.some((l) => l.includes("Chase") && l.includes("(Credit card)"))).toBe(true);
    fireEvent.change(select, { target: { value: "m1" } });
    expect(onChange).toHaveBeenCalledWith("m1");
  });

  it("creates a bank transfer inline with its method and selects the new id", async () => {
    const { onChange, createMethod } = setup();
    fireEvent.click(screen.getByRole("button", { name: /New method/ }));
    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "BANK_TRANSFER" } });
    // Controlled combobox: every keystroke reports the text; <select>s share the role.
    fireEvent.change(screen.getByLabelText("Method"), { target: { value: "Autogiro" } });
    fireEvent.change(screen.getByLabelText("Method name"), { target: { value: "Bancolombia" } });
    fireEvent.click(screen.getByRole("button", { name: "Save method" }));

    await waitFor(() => expect(onChange).toHaveBeenCalledWith("new1"));
    expect(createMethod).toHaveBeenCalledWith({
      name: "Bancolombia",
      type: "BANK_TRANSFER",
      network: "Autogiro",
    });
    expect(screen.getByLabelText("Payment method")).toBeInTheDocument();
  });

  it("asks for the last 4 only for cards and surfaces the API's duplicate message", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    const { onError } = setup(
      jest
        .fn()
        .mockRejectedValue(
          new Error(JSON.stringify({ error: 'You already have a Credit card called "Chase"' }))
        )
    );
    fireEvent.click(screen.getByRole("button", { name: /New method/ }));
    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "CASH" } });
    expect(screen.queryByLabelText("Last 4 numbers")).toBeNull();

    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "CREDIT_CARD" } });
    expect(screen.getByLabelText("Last 4 numbers")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Method name"), { target: { value: "Chase" } });
    fireEvent.click(screen.getByRole("button", { name: "Save method" }));

    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith('You already have a Credit card called "Chase"')
    );
  });
});
