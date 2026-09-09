import { groupMethodsByType, sortByName } from "./paymentMethodOptions";

const methods = [
  { name: "revolut", type: "DIGITAL_WALLET" as const },
  { name: "Chase Sapphire", type: "CREDIT_CARD" as const },
  { name: "Bancolombia", type: "BANK_TRANSFER" as const },
  { name: "Amex", type: "CREDIT_CARD" as const },
];

describe("sortByName", () => {
  it("orders by name regardless of case and leaves the input untouched", () => {
    const sorted = sortByName(methods);
    expect(sorted.map((m) => m.name)).toEqual(["Amex", "Bancolombia", "Chase Sapphire", "revolut"]);
    expect(methods[0].name).toBe("revolut");
  });
});

describe("groupMethodsByType", () => {
  it("groups in display order, sorted by name inside, skipping empty types", () => {
    const groups = groupMethodsByType(methods);
    expect(groups.map((g) => [g.label, g.methods.map((m) => m.name)])).toEqual([
      ["Credit card", ["Amex", "Chase Sapphire"]],
      ["Bank transfer", ["Bancolombia"]],
      ["Digital wallet", ["revolut"]],
    ]);
  });
});
