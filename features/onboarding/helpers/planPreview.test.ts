import { hasForeignCurrency, sortPlanItems } from "./planPreview";
import { IDENTITY_RATES } from "../../../helpers/fx";
import type { RecurrentTransaction } from "../../../types";

const ctx = { rates: IDENTITY_RATES, target: "USD" as const };
const item = (name: string, amount: number, frequency: string, currency = "USD") =>
  ({ name, amount, frequency, currency }) as RecurrentTransaction;

describe("sortPlanItems", () => {
  it("groups by cadence like the wizard, then by monthly weight", () => {
    const sorted = sortPlanItems(
      [
        item("Insurance", 1200, "YEARLY"),
        item("Gym", 40, "MONTHLY"),
        item("Rent", 1500, "MONTHLY"),
        item("Groceries", 100, "WEEKLY"),
      ],
      ctx
    );
    expect(sorted.map((i) => i.name)).toEqual(["Rent", "Gym", "Insurance", "Groceries"]);
  });
});

describe("hasForeignCurrency", () => {
  it("is true only when an item is in another currency than the target", () => {
    expect(hasForeignCurrency([item("Rent", 1, "MONTHLY")], "USD")).toBe(false);
    expect(hasForeignCurrency([item("Rent", 1, "MONTHLY", "COP")], "USD")).toBe(true);
  });
});
