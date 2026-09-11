import { paymentMethodLabel, paymentMethodOptionLabel } from "./paymentMethodLabel";

describe("paymentMethodLabel", () => {
  it("renders name and last4 for cards", () => {
    expect(paymentMethodLabel({ name: "Chase Sapphire", type: "CREDIT_CARD", last4: "4242" })).toBe(
      "Chase Sapphire - 4242"
    );
  });

  it("falls back to the plain name", () => {
    expect(paymentMethodLabel({ name: "Wise", type: "DIGITAL_WALLET" })).toBe("Wise");
  });

  it("renders a dash for a missing method", () => {
    expect(paymentMethodLabel(undefined)).toBe("—");
  });
});

describe("paymentMethodOptionLabel", () => {
  it("shows the bank-transfer method and the type", () => {
    expect(
      paymentMethodOptionLabel({ name: "SEB", type: "BANK_TRANSFER", network: "Autogiro" })
    ).toBe("SEB - Autogiro (Bank transfer)");
  });

  it("shows network, masked digits and type for a card", () => {
    expect(
      paymentMethodOptionLabel({
        name: "Chase Sapphire",
        type: "CREDIT_CARD",
        network: "Visa",
        last4: "4242",
      })
    ).toBe("Chase Sapphire - Visa ••4242 (Credit card)");
  });

  it("keeps it short when only a name exists", () => {
    expect(paymentMethodOptionLabel({ name: "Efectivo", type: "CASH" })).toBe("Efectivo (Cash)");
  });
});
