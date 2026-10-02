import { render, screen, fireEvent, within, waitFor } from "@testing-library/react";

let methodsValue: {
  id: string;
  name: string;
  type: string;
  network?: string;
  last4?: string;
}[] = [];

jest.mock("../../../hooks/usePaymentMethods", () => ({
  usePaymentMethods: () => ({
    methods: methodsValue,
    loading: false,
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  }),
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

const openItem = () => document.querySelector(".item--open") as HTMLElement;

beforeEach(() => {
  methodsValue = [];
});

describe("MethodsStep", () => {
  it("adds a blank row: the click event never leaks into the row", () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: /add more/i }));

    // The click event used to be spread into the new row as overrides, so its
    // `type` became "click": the select fell back to showing "Credit card"
    // while none of the card fields rendered.
    expect(screen.getByTestId("types")).toHaveTextContent("-,-");
    // One item open at a time: the new one, blank.
    const selects = screen.getAllByLabelText("Type") as HTMLSelectElement[];
    expect(selects).toHaveLength(1);
    expect(within(openItem()).getByLabelText("Type")).toHaveValue("");
    expect(document.querySelectorAll(".item")).toHaveLength(2);
  });

  it("shows the card fields as soon as a new row picks Credit card", () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: /add more/i }));
    fireEvent.change(within(openItem()).getByLabelText("Type"), {
      target: { value: "CREDIT_CARD" },
    });

    expect(within(openItem()).getByLabelText(/last 4 digits/i)).toBeInTheDocument();
  });

  it("draws the row as the object it is, updating as you type", () => {
    render(<Harness />);

    fireEvent.change(within(openItem()).getByLabelText("Type"), {
      target: { value: "DEBIT_CARD" },
    });
    fireEvent.change(within(openItem()).getByLabelText(/last 4 digits/i), {
      target: { value: "8817" },
    });

    expect(openItem().querySelector("[data-kind='card']")).toBeInTheDocument();
    expect(within(openItem()).getByText("8817")).toBeInTheDocument();
  });

  it("opens a saved method from its face, with only the type locked", async () => {
    methodsValue = [
      { id: "pm1", name: "Bancolombia", type: "DEBIT_CARD", network: "Mastercard", last4: "8817" },
      { id: "pm2", name: "Wise", type: "DIGITAL_WALLET", network: "Wise" },
    ];
    render(<Harness />);

    // A wallet of saved methods starts closed.
    const face = await screen.findByRole("button", { name: /Bancolombia, Debit card/ });
    expect(face).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByLabelText("Type")).not.toBeInTheDocument();

    fireEvent.click(face);

    // The open face is a plain preview: only "Done" closes the form.
    expect(
      screen.queryByRole("button", { name: /Bancolombia, Debit card/ })
    ).not.toBeInTheDocument();
    expect(within(openItem()).getByLabelText("Type")).toBeDisabled();
    expect(within(openItem()).getByLabelText("Alias")).toBeEnabled();
    expect(within(openItem()).getByLabelText(/last 4 digits/i)).toBeEnabled();

    // Opening the other closes this one.
    fireEvent.click(screen.getByRole("button", { name: /Wise, Digital wallet/ }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Bancolombia, Debit card/ })).toHaveAttribute(
        "aria-expanded",
        "false"
      )
    );
    expect(screen.getAllByLabelText("Type")).toHaveLength(1);
  });

  it("removes from the open item's footer, not from a column beside the fields", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: /add more/i }));

    const footerRemove = within(openItem()).getByRole("button", { name: /remove/i });
    expect(footerRemove.closest(".footer")).not.toBeNull();

    fireEvent.click(footerRemove);

    expect(document.querySelectorAll(".item")).toHaveLength(1);
  });
});
