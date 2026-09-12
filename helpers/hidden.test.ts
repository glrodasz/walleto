import {
  hiddenCategoryIds,
  hiddenItemIds,
  hiddenRowReason,
  isHiddenRow,
  withoutHidden,
} from "./hidden";

describe("hiddenItemIds / hiddenCategoryIds", () => {
  it("collects hidden items and hidden roots with their children", () => {
    expect(
      hiddenItemIds([
        { id: "a", hiddenFromDashboard: true },
        { id: "b" },
        { hiddenFromDashboard: true },
      ])
    ).toEqual(new Set(["a"]));
    expect(
      hiddenCategoryIds([
        { id: "home", hiddenFromChart: true },
        { id: "rent", parentId: "home" },
        { id: "food" },
        { id: "bread", parentId: "food", hiddenFromChart: true },
      ])
    ).toEqual(new Set(["home", "rent"]));
  });
});

describe("isHiddenRow / withoutHidden", () => {
  const items = new Set(["netflix"]);
  const cats = new Set(["home"]);

  it("hides rows through their item or their category, never on their own", () => {
    expect(isHiddenRow({ recurrentTransactionId: "netflix", categoryId: "fun" }, items)).toBe(true);
    expect(isHiddenRow({ categoryId: "home" }, items, cats)).toBe(true);
    expect(isHiddenRow({ categoryId: "home" }, items)).toBe(false);
    expect(isHiddenRow({ recurrentTransactionId: "rent", categoryId: "fun" }, items, cats)).toBe(
      false
    );
  });

  it("says which rule hid the row, the item winning when both do", () => {
    expect(hiddenRowReason({ recurrentTransactionId: "netflix", categoryId: "fun" }, items)).toBe(
      "dashboard"
    );
    expect(hiddenRowReason({ categoryId: "home" }, items, cats)).toBe("chart");
    expect(
      hiddenRowReason({ recurrentTransactionId: "netflix", categoryId: "home" }, items, cats)
    ).toBe("dashboard");
    expect(hiddenRowReason({ categoryId: "fun" }, items, cats)).toBeNull();
  });

  it("filters a list", () => {
    const rows = [
      { id: 1, recurrentTransactionId: "netflix", categoryId: "fun" },
      { id: 2, categoryId: "home" },
      { id: 3, categoryId: "fun" },
    ];
    expect(withoutHidden(rows, items, cats).map((r) => r.id)).toEqual([3]);
    expect(withoutHidden(rows, items).map((r) => r.id)).toEqual([2, 3]);
  });
});
