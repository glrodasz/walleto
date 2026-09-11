import { IDENTITY_RATES } from "../../../helpers/fx";
import { EMPTY_FILTERS, NO_METHOD, filterTransactions } from "./transactionFilters";
import type { Category, Tag, Transaction } from "../../../types";

const ctx = { rates: IDENTITY_RATES, target: "USD" as const };

const tx = (id: string, name: string, day: number, extra: Partial<Transaction> = {}) =>
  ({
    id,
    userId: "u",
    domain: "EXPENSE",
    categoryId: "home",
    name,
    amount: 10,
    currency: "USD",
    occurredAt: new Date(2026, 8, day),
    status: "PAID",
    ...extra,
  }) as Transaction;

const categories = [
  { id: "home", name: "Home", domain: "EXPENSE" },
  { id: "rent", name: "Rent", domain: "EXPENSE", parentId: "home" },
  { id: "fun", name: "Fun", domain: "EXPENSE" },
] as Category[];
const tags = [{ id: "t1", name: "Trip2026", key: "trip2026" }] as Tag[];

const rows = [
  tx("a", "Netflix", 1, { amount: 15, categoryId: "fun", paymentMethodId: "card" }),
  tx("b", "Rent", 5, { amount: 900, categoryId: "rent", note: "Shared with Ana" }),
  tx("c", "Coffee", 9, { amount: 4, tags: ["t1"] }),
];

describe("filterTransactions", () => {
  it("sorts newest first by default and can flip", () => {
    expect(
      filterTransactions(rows, EMPTY_FILTERS, { categories, tags, ctx }).map((t) => t.id)
    ).toEqual(["c", "b", "a"]);
    expect(
      filterTransactions(
        rows,
        { ...EMPTY_FILTERS, sort: { by: "date", dir: "asc" } },
        { categories, tags, ctx }
      ).map((t) => t.id)
    ).toEqual(["a", "b", "c"]);
    expect(
      filterTransactions(
        rows,
        { ...EMPTY_FILTERS, sort: { by: "amount", dir: "desc" } },
        { categories, tags, ctx }
      ).map((t) => t.id)
    ).toEqual(["b", "a", "c"]);
  });

  it("searches name, note and tag names", () => {
    const search = (s: string) =>
      filterTransactions(rows, { ...EMPTY_FILTERS, search: s }, { categories, tags, ctx }).map(
        (t) => t.id
      );
    expect(search("net")).toEqual(["a"]);
    expect(search("ana")).toEqual(["b"]);
    expect(search("trip")).toEqual(["c"]);
    expect(search("zzz")).toEqual([]);
  });

  it("narrows by root category including its children, and by payment method", () => {
    const by = (f: Partial<typeof EMPTY_FILTERS>) =>
      filterTransactions(rows, { ...EMPTY_FILTERS, ...f }, { categories, tags, ctx }).map(
        (t) => t.id
      );
    expect(by({ categoryId: "home" })).toEqual(["c", "b"]);
    expect(by({ categoryId: "fun" })).toEqual(["a"]);
    expect(by({ paymentMethodId: "card" })).toEqual(["a"]);
    expect(by({ paymentMethodId: NO_METHOD })).toEqual(["c", "b"]);
  });
});
