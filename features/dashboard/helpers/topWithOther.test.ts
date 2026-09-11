import { topWithOther } from "./topWithOther";

const row = (name: string, amount: number, percent: number) => ({
  categoryId: name.toLowerCase(),
  name,
  amount,
  percent,
});

describe("topWithOther", () => {
  it("returns rows unchanged when they fit the limit", () => {
    const rows = [row("Rent", 800, 80), row("Food", 200, 20)];
    expect(topWithOther(rows, 5)).toEqual(rows);
  });

  it("folds the tail into an Other bucket that keeps the total at 100%", () => {
    const rows = [
      row("Rent", 500, 50),
      row("Food", 200, 20),
      row("Transport", 150, 15),
      row("Fun", 100, 10),
      row("Misc", 50, 5),
    ];

    const result = topWithOther(rows, 3);

    expect(result).toHaveLength(4);
    expect(result[3]).toEqual({ categoryId: "__other", name: "Other", amount: 150, percent: 15 });
    expect(result.reduce((s, r) => s + r.percent, 0)).toBe(100);
  });
});
