import { categoryIdSet, rootIdMap, rootIdOf } from "./categoryTree";
import type { Category } from "../types";

const cats = [
  { id: "home", name: "Home", domain: "EXPENSE" },
  { id: "rent", name: "Rent", domain: "EXPENSE", parentId: "home" },
  { id: "power", name: "Power", domain: "EXPENSE", parentId: "home" },
  { id: "fun", name: "Fun", domain: "EXPENSE" },
] as Category[];

describe("categoryTree", () => {
  it("collects a root and its children", () => {
    expect(Array.from(categoryIdSet(cats[0], cats)).sort()).toEqual(["home", "power", "rent"]);
    expect(Array.from(categoryIdSet(cats[3], cats))).toEqual(["fun"]);
  });

  it("maps every id to its root", () => {
    const roots = rootIdMap(cats);
    expect(roots.get("rent")).toBe("home");
    expect(roots.get("home")).toBe("home");
    expect(rootIdOf("power", roots)).toBe("home");
    expect(rootIdOf("unknown", roots)).toBe("unknown");
  });
});
