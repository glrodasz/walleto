import { essentialIsGuessed, isEssential, isSubscription } from "./essential";

const categories = [
  { id: "cat-home", name: "Home & Family" },
  { id: "cat-subs", name: "Subscriptions" },
  { id: "cat-var", name: "Variable" },
];

describe("isSubscription", () => {
  it("matches an explicit SUBSCRIPTION type", () => {
    expect(isSubscription({ type: "SUBSCRIPTION", categoryId: "cat-home" }, categories)).toBe(true);
  });

  it("matches the Subscriptions category when type is unset", () => {
    expect(isSubscription({ categoryId: "cat-subs" }, categories)).toBe(true);
  });

  it("is case-insensitive on the category name", () => {
    expect(isSubscription({ categoryId: "x" }, [{ id: "x", name: "  subscriptions  " }])).toBe(
      true
    );
  });

  it("rejects anything else", () => {
    expect(isSubscription({ type: "OTHER", categoryId: "cat-home" }, categories)).toBe(false);
  });
});

describe("isEssential", () => {
  const expense = (over: object = {}) => ({
    domain: "EXPENSE" as const,
    categoryId: "cat-home",
    ...over,
  });

  it("keeps the owner's flag over any guess", () => {
    expect(isEssential(expense({ categoryId: "cat-subs", essential: true }), categories)).toBe(
      true
    );
    expect(isEssential(expense({ essential: false }), categories)).toBe(false);
  });

  it("guesses subscriptions and Variable as dispensable", () => {
    expect(isEssential(expense({ categoryId: "cat-subs" }), categories)).toBe(false);
    expect(isEssential(expense({ type: "SUBSCRIPTION" }), categories)).toBe(false);
    expect(isEssential(expense({ categoryId: "cat-var" }), categories)).toBe(false);
  });

  it("guesses any other expense as essential, unknown categories included", () => {
    expect(isEssential(expense(), categories)).toBe(true);
    expect(isEssential(expense({ categoryId: "gone" }), categories)).toBe(true);
  });

  it("always keeps debt payments and never keeps contributions", () => {
    expect(isEssential({ domain: "DEBT", categoryId: "x", essential: false }, categories)).toBe(
      true
    );
    expect(isEssential({ domain: "INVESTMENT", categoryId: "x", essential: true }, [])).toBe(false);
    expect(isEssential({ domain: "SAVING", categoryId: "x" }, [])).toBe(false);
  });
});

describe("essentialIsGuessed", () => {
  it("is true only for an expense without a flag", () => {
    expect(essentialIsGuessed({ domain: "EXPENSE" })).toBe(true);
    expect(essentialIsGuessed({ domain: "EXPENSE", essential: false })).toBe(false);
    expect(essentialIsGuessed({ domain: "DEBT" })).toBe(false);
  });
});
