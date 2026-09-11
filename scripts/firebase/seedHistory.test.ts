import { buildHistory, jitterFactor, roundForCurrency } from "./seedHistory";
import type { Currency, RecurrentTransaction, Timestamp } from "../../types";

const ts = (iso: string): Timestamp => {
  const date = new Date(iso);
  return { seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0, toDate: () => date };
};

const item = (overrides: Partial<RecurrentTransaction> = {}): RecurrentTransaction => ({
  id: "item1",
  userId: "user1",
  domain: "EXPENSE",
  categoryId: "cat1",
  name: "Netflix",
  amount: 16,
  currency: "USD" as Currency,
  frequency: "MONTHLY",
  startDate: ts("2026-01-12T12:00:00.000Z"),
  active: true,
  ...overrides,
});

const RANGE = {
  from: new Date("2026-01-01T00:00:00.000Z"),
  to: new Date("2026-06-30T00:00:00.000Z"),
};

describe("jitterFactor", () => {
  it("is deterministic for the same key", () => {
    expect(jitterFactor("item1_2026-03-15")).toBe(jitterFactor("item1_2026-03-15"));
  });

  it("differs across keys", () => {
    expect(jitterFactor("item1_2026-03-15")).not.toBe(jitterFactor("item1_2026-04-15"));
  });

  it("stays inside the spread", () => {
    for (const key of ["a", "b", "c", "item1_2026-03-15", "x_2026-12-01"]) {
      const factor = jitterFactor(key);
      expect(factor).toBeGreaterThanOrEqual(0.85);
      expect(factor).toBeLessThanOrEqual(1.15);
    }
  });
});

describe("roundForCurrency", () => {
  it("keeps cents for decimal currencies", () => {
    expect(roundForCurrency(16.499, "USD")).toBe(16.5);
  });

  it("rounds zero-decimal currencies to whole units", () => {
    expect(roundForCurrency(64912.7, "COP")).toBe(64913);
    expect(roundForCurrency(1499.4, "JPY")).toBe(1499);
  });
});

describe("buildHistory", () => {
  it("emits one doc per occurrence with the materializer's deterministic id", () => {
    const docs = buildHistory([item()], RANGE);

    expect(docs.map((d) => d.id)).toEqual([
      "item1_2026-01-12",
      "item1_2026-02-12",
      "item1_2026-03-12",
      "item1_2026-04-12",
      "item1_2026-05-12",
      "item1_2026-06-12",
    ]);
    expect(docs[0].data).toMatchObject({
      userId: "user1",
      domain: "EXPENSE",
      recurrentTransactionId: "item1",
      name: "Netflix",
      amount: 16,
      currency: "USD",
    });
    expect(docs[0].data.occurredAt).toBeInstanceOf(Date);
  });

  it("leaves fixed items at their exact amount", () => {
    const docs = buildHistory([item()], RANGE);
    expect(docs.every((d) => d.data.amount === 16)).toBe(true);
  });

  it("jitters only the items marked variable, deterministically", () => {
    const opts = { ...RANGE, variableIds: new Set(["item1"]) };
    const first = buildHistory([item()], opts);
    const second = buildHistory([item()], opts);

    const amounts = first.map((d) => d.data.amount as number);
    expect(new Set(amounts).size).toBeGreaterThan(1);
    for (const amount of amounts) {
      expect(amount).toBeGreaterThanOrEqual(16 * 0.85);
      expect(amount).toBeLessThanOrEqual(16 * 1.15);
    }
    expect(second.map((d) => d.data.amount)).toEqual(amounts);
  });

  it("jitters the charged pair alongside the amount", () => {
    const docs = buildHistory([item({ chargedAmount: 64000, chargedCurrency: "COP" })], {
      ...RANGE,
      variableIds: new Set(["item1"]),
    });

    const doc = docs[0].data;
    expect(doc.chargedAmount).not.toBe(64000);
    // Both sides moved by the same factor, so the implied rate is preserved.
    expect((doc.chargedAmount as number) / (doc.amount as number)).toBeCloseTo(64000 / 16, 0);
    expect(Number.isInteger(doc.chargedAmount)).toBe(true);
  });

  it("skips inactive items and items without an id", () => {
    const docs = buildHistory([item({ active: false }), item({ id: undefined })], RANGE);
    expect(docs).toEqual([]);
  });

  it("keeps each item's occurrences separate", () => {
    const docs = buildHistory(
      [item({ id: "a", name: "Netflix" }), item({ id: "b", name: "Spotify", amount: 7 })],
      RANGE
    );

    expect(docs.filter((d) => d.id.startsWith("a_"))).toHaveLength(6);
    expect(docs.filter((d) => d.id.startsWith("b_"))).toHaveLength(6);
  });
});
