import { render, screen, fireEvent, within } from "@testing-library/react";

jest.mock("../../../hooks/usePaymentMethods", () => ({
  usePaymentMethods: () => ({ methods: [], loading: false, create: jest.fn(), remove: jest.fn() }),
}));

import { MethodsStep } from "./MethodsStep";
import { useMethodsStep } from "../hooks/useMethodsStep";

function Harness() {
  const state = useMethodsStep();
  return (
    <>
      <MethodsStep state={state} />
      <output data-testid="types">{state.rows.map((r) => r.type || "-").join(",")}</output>
    </>
  );
}

describe("MethodsStep", () => {
  it("adds a blank row: the click event never leaks into the row", () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: /add more/i }));

    // The click event used to be spread into the new row as overrides, so its
    // `type` became "click": the select fell back to showing "Credit card"
    // while none of the card fields rendered.
    expect(screen.getByTestId("types")).toHaveTextContent("-,-");
    const selects = screen.getAllByLabelText("Type") as HTMLSelectElement[];
    expect(selects).toHaveLength(2);
    expect(selects[1].value).toBe("");
  });

  it("shows the card fields as soon as a new row picks Credit card", () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: /add more/i }));
    const second = screen.getAllByLabelText("Type")[1];
    fireEvent.change(second, { target: { value: "CREDIT_CARD" } });

    const rows = document.querySelectorAll(".row");
    expect(within(rows[1] as HTMLElement).getByLabelText(/last 4 digits/i)).toBeInTheDocument();
  });
});
