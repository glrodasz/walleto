import { defaultIconFor, iconFor } from "./categoryIcons";

describe("defaultIconFor", () => {
  it("knows every seeded default by name, whatever the case", () => {
    expect(defaultIconFor("Salary", "INCOME")).toBe("briefcase");
    expect(defaultIconFor("home & family", "EXPENSE")).toBe("family");
    expect(defaultIconFor("SUBSCRIPTIONS", "EXPENSE")).toBe("subscriptions");
    expect(defaultIconFor("Emergency fund", "SAVING")).toBe("lifebuoy");
    expect(defaultIconFor("Crypto", "INVESTMENT")).toBe("bitcoin");
  });

  it("matches user-typed names by keyword", () => {
    expect(defaultIconFor("Bestsvagen 6, Mortgage", "EXPENSE")).toBe("landmark");
    expect(defaultIconFor("Pet insurance", "EXPENSE")).toBe("shield");
    expect(defaultIconFor("Groceries", "EXPENSE")).toBe("cart");
    expect(defaultIconFor("Child allowance", "INCOME")).toBe("family");
    expect(defaultIconFor("Index funds", "INVESTMENT")).toBe("chart");
  });

  it("falls back per domain", () => {
    expect(defaultIconFor("Misc", "INCOME")).toBe("coins");
    expect(defaultIconFor("Misc", "EXPENSE")).toBe("tag");
    expect(defaultIconFor("Misc", "INVESTMENT")).toBe("chart");
    expect(defaultIconFor("Misc", "SAVING")).toBe("piggy");
  });
});

describe("iconFor", () => {
  it("prefers the category's own pick", () => {
    expect(iconFor({ icon: "plane", name: "Salary", domain: "INCOME" })).toBe("plane");
    expect(iconFor({ name: "Salary", domain: "INCOME" })).toBe("briefcase");
  });
});
