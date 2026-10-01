import { render, screen, fireEvent } from "@testing-library/react";
import { MethodFace, MethodFaceButton } from ".";
import type { PaymentMethodType } from "../../../types";

const kindOf = (container: HTMLElement) =>
  container.querySelector("[data-kind]")?.getAttribute("data-kind");

describe("MethodFace", () => {
  it.each<[PaymentMethodType, string]>([
    ["CREDIT_CARD", "card"],
    ["DEBIT_CARD", "card"],
    ["BANK_TRANSFER", "check"],
    ["DIGITAL_WALLET", "wallet"],
    ["CRYPTO_WALLET", "crypto"],
    ["CASH", "cash"],
    ["OTHER", "ticket"],
  ])("draws %s as a %s, with its alias", (type, kind) => {
    const { container } = render(<MethodFace type={type} name="My method" />);
    expect(kindOf(container)).toBe(kind);
    expect(screen.getByText("My method")).toBeInTheDocument();
  });

  it("shows a card's last 4 behind the dots, in both sizes", () => {
    const { rerender } = render(
      <MethodFace type="DEBIT_CARD" name="Bancolombia" network="Mastercard" last4="8817" />
    );
    expect(screen.getByText("•••• 8817")).toBeInTheDocument();
    // Mastercard is drawn (its circles), not written.
    expect(document.querySelector("[data-brand='mastercard']")).toBeInTheDocument();

    rerender(<MethodFace type="DEBIT_CARD" name="Bancolombia" last4="8817" size="full" />);
    expect(screen.getByText("8817")).toBeInTheDocument();
  });

  it.each<[PaymentMethodType, string]>([
    ["CREDIT_CARD", "Credit"],
    ["DEBIT_CARD", "Debit"],
    ["BANK_TRANSFER", "Bank transfer"],
    ["DIGITAL_WALLET", "Digital wallet"],
    ["CRYPTO_WALLET", "Crypto wallet"],
    ["CASH", "Cash"],
    ["OTHER", "Other"],
  ])("opens %s to the same layout: alias top left, %s top right", (type, corner) => {
    const { container } = render(<MethodFace type={type} name="My method" size="full" />);
    expect(container.querySelector(".title")).toHaveTextContent("My method");
    expect(container.querySelector(".corner")).toHaveTextContent(corner);
  });

  it("prints the full number on an open card", () => {
    const { container } = render(
      <MethodFace type="CREDIT_CARD" name="Chase" network="Visa" last4="4242" size="full" />
    );
    expect(container.querySelector(".detail")).toHaveTextContent("•••• •••• •••• 4242");
    expect(screen.getByText("VISA")).toBeInTheDocument();
  });

  it("draws a wallet app with the provider's initial, not as a phone", () => {
    render(<MethodFace type="DIGITAL_WALLET" name="Main" network="Revolut" />);
    expect(screen.getByText("R")).toBeInTheDocument();
    expect(screen.getByText("Revolut")).toBeInTheDocument();
  });

  it("puts a transfer's method in the memo", () => {
    render(<MethodFace type="BANK_TRANSFER" name="SEB" network="Autogiro" />);
    expect(screen.getByText("Memo")).toBeInTheDocument();
    expect(screen.getByText("Autogiro")).toBeInTheDocument();
  });

  it("prompts for an alias while there isn't one", () => {
    render(<MethodFace type="CASH" name="  " />);
    expect(screen.getByText("Add an alias")).toBeInTheDocument();
  });

  it("is a placeholder until a type is picked", () => {
    const { container } = render(<MethodFace type="" name="" />);
    expect(kindOf(container)).toBe("blank");
    expect(screen.getByText("New payment method")).toBeInTheDocument();
  });

  it("is decoration: the picture is hidden from assistive tech", () => {
    const { container } = render(<MethodFace type="CASH" name="Efectivo" />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });
});

describe("MethodFaceButton", () => {
  it("is named by its label, not by the drawing", () => {
    const onClick = jest.fn();
    render(
      <MethodFaceButton
        type="DEBIT_CARD"
        name="Bancolombia"
        last4="8817"
        label="Edit Bancolombia, Debit card, ending in 8817"
        onClick={onClick}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Edit Bancolombia, Debit card, ending in 8817" })
    );
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
