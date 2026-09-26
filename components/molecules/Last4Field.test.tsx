import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { Last4Field } from "./Last4Field";
import { LAST4_ERROR } from "../../helpers/paymentMethodOptions";

function Harness({ initial = "", showError }: { initial?: string; showError?: boolean }) {
  const [value, setValue] = useState(initial);
  return <Last4Field value={value} onChange={setValue} showError={showError} />;
}

describe("Last4Field", () => {
  it("opts out of card autofill and says it isn't the security code", () => {
    render(<Harness />);
    const input = screen.getByLabelText("Last 4 digits (optional)");
    expect(input).toHaveAttribute("name", "last4");
    expect(input).toHaveAttribute("autocomplete", "off");
    expect(screen.getByText(/not the security code/)).toBeInTheDocument();
  });

  it("keeps digits only, up to four", () => {
    render(<Harness />);
    const input = screen.getByLabelText("Last 4 digits (optional)");
    fireEvent.change(input, { target: { value: "4a2-4 21" } });
    expect(input).toHaveValue("4242");
  });

  it("flags a partial value on blur, not while typing", () => {
    render(<Harness />);
    const input = screen.getByLabelText("Last 4 digits (optional)");
    fireEvent.change(input, { target: { value: "42" } });
    expect(screen.queryByText(LAST4_ERROR)).not.toBeInTheDocument();
    fireEvent.blur(input);
    expect(screen.getByText(LAST4_ERROR)).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("flags a partial value straight away when asked to", () => {
    render(<Harness initial="42" showError />);
    expect(screen.getByText(LAST4_ERROR)).toBeInTheDocument();
  });
});
