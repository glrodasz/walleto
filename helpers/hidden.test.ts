import {
  hiddenCategoryIds,
  hiddenItemIds,
  hiddenRowReasons,
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
      hiddenItemIds(
        [
          { id: "a", hiddenFromDashboard: true },
          { id: "b", hiddenFromChart: true },
          { id: "c", hiddenFromDashboard: true, hiddenFromChart: true },
        ],
        "chart"
      )
    ).toEqual(new Set(["b", "c"]));
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

  it("lists every rule that hid the row, chart first", () => {
    const sets = {
      dashboardItems: new Set(["netflix", "gym"]),
      chartItems: new Set(["gym", "rent"]),
      chartCategories: cats,
    };
    expect(
      hiddenRowReasons({ recurrentTransactionId: "netflix", categoryId: "fun" }, sets)
    ).toEqual(["dashboard"]);
    expect(hiddenRowReasons({ recurrentTransactionId: "rent", categoryId: "fun" }, sets)).toEqual([
      "chart",
    ]);
    expect(hiddenRowReasons({ categoryId: "home" }, sets)).toEqual(["chart"]);
    expect(hiddenRowReasons({ recurrentTransactionId: "gym", categoryId: "fun" }, sets)).toEqual([
      "chart",
      "dashboard",
    ]);
    expect(
      hiddenRowReasons({ recurrentTransactionId: "netflix", categoryId: "home" }, sets)
    ).toEqual(["chart", "dashboard"]);
    expect(hiddenRowReasons({ categoryId: "fun" }, sets)).toEqual([]);
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
