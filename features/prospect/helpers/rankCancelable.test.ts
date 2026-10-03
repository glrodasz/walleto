import { rankCancelable, topNonEssentialIds } from "./rankCancelable";
import { IDENTITY_RATES } from "../../../helpers/fx";
import type { Currency, RecurrentTransaction } from "../../../types";

const ctx = { rates: IDENTITY_RATES, target: "USD" as Currency };

const categories = [
  { id: "cat-subs", name: "Subscriptions" },
  { id: "cat-home", name: "Home & Family" },
];

const item = (over: Partial<RecurrentTransaction>): RecurrentTransaction => ({
  id: over.name,
  userId: "u1",
  domain: "EXPENSE",
  categoryId: "cat-home",
  name: "x",
  amount: 10,
  currency: "USD",
  frequency: "MONTHLY",
  startDate: { seconds: 0, nanoseconds: 0, toDate: () => new Date(0) },
  active: true,
  ...over,
});

const items = [
  item({ name: "Rent", amount: 1_200 }),
  item({ name: "Netflix", categoryId: "cat-subs", amount: 16 }),
  item({ name: "Gym", amount: 40, essential: false }),
  item({ name: "Annual app", categoryId: "cat-subs", amount: 120, frequency: "YEARLY" }),
  item({ name: "Spotify", categoryId: "cat-subs", amount: 11 }),
  item({ name: "ETF", domain: "INVESTMENT", amount: 300 }),
  item({ name: "Pocket", domain: "SAVING", amount: 200 }),
  item({ name: "Card", domain: "DEBT", amount: 150 }),
  item({ name: "Salary", domain: "INCOME", amount: 5_000 }),
];

const names = (rows: { item: RecurrentTransaction }[]) => rows.map((r) => r.item.name);

describe("rankCancelable", () => {
  const groups = rankCancelable(items, categories, ctx);

  it("sorts the plan into the four groups, income left out", () => {
    expect(names(groups.essential)).toEqual(["Rent"]);
    expect(names(groups.contributions)).toEqual(["ETF", "Pocket"]);
    expect(names(groups.debts)).toEqual(["Card"]);
  });

  it("ranks non-essential spending by its monthly cost", () => {
    expect(names(groups.nonEssential)).toEqual(["Gym", "Netflix", "Spotify", "Annual app"]);
    expect(groups.nonEssential.map((r) => r.monthly)).toEqual([40, 16, 11, 10]);
  });

  it("marks which flags are guesses", () => {
    const gym = groups.nonEssential.find((r) => r.item.name === "Gym")!;
    const netflix = groups.nonEssential.find((r) => r.item.name === "Netflix")!;
    expect(gym.guessed).toBe(false);
    expect(netflix.guessed).toBe(true);
  });

  it("picks the top n non-essential ids", () => {
    expect(topNonEssentialIds(groups, 2)).toEqual(["Gym", "Netflix"]);
    expect(topNonEssentialIds(groups, 10)).toHaveLength(4);
  });
});
