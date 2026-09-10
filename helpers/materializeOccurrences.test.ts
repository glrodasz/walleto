import {
  materializeOccurrences,
  occurrenceId,
  occurrenceToTransaction,
} from "./materializeOccurrences";
import type { RecurrentTransaction, Timestamp } from "../types";

const ts = (iso: string): Timestamp => {
  const date = new Date(iso);
  return {
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: 0,
    toDate: () => date,
  };
};

const item = (overrides: Partial<RecurrentTransaction> = {}): RecurrentTransaction => ({
  id: "item1",
  userId: "user1",
  domain: "EXPENSE",
  categoryId: "cat1",
  name: "Netflix",
  amount: 15,
  currency: "USD",
  frequency: "MONTHLY",
  startDate: ts("2026-01-15T12:00:00.000Z"),
  active: true,
  ...overrides,
});

describe("materializeOccurrences", () => {
  it("generates monthly occurrences inside the range with deterministic ids", () => {
    const occurrences = materializeOccurrences(
      item(),
      new Date("2026-03-01T00:00:00.000Z"),
      new Date("2026-05-31T00:00:00.000Z")
    );

    expect(occurrences.map((o) => o.id)).toEqual([
      "item1_2026-03-15",
      "item1_2026-04-15",
      "item1_2026-05-15",
    ]);
  });

  it("includes the start date itself when it falls inside the range", () => {
    const occurrences = materializeOccurrences(
      item(),
      new Date("2026-01-01T00:00:00.000Z"),
      new Date("2026-02-20T00:00:00.000Z")
    );

    expect(occurrences.map((o) => o.id)).toEqual(["item1_2026-01-15", "item1_2026-02-15"]);
  });

  it("clamps a month-end anchor to shorter months", () => {
    const occurrences = materializeOccurrences(
      item({ startDate: ts("2026-01-31T12:00:00.000Z") }),
      new Date("2026-02-01T00:00:00.000Z"),
      new Date("2026-03-31T23:00:00.000Z")
    );

    expect(occurrences.map((o) => o.id)).toEqual(["item1_2026-02-28", "item1_2026-03-31"]);
  });

  it("steps weekly schedules by exact days", () => {
    const occurrences = materializeOccurrences(
      item({ frequency: "WEEKLY", startDate: ts("2026-06-01T00:00:00.000Z") }),
      new Date("2026-06-10T00:00:00.000Z"),
      new Date("2026-06-30T00:00:00.000Z")
    );

    expect(occurrences.map((o) => o.id)).toEqual([
      "item1_2026-06-15",
      "item1_2026-06-22",
      "item1_2026-06-29",
    ]);
  });

  it("emits a ONE_TIME item exactly once, only when its date is in range", () => {
    const oneTime = item({ frequency: "ONE_TIME", startDate: ts("2026-04-10T00:00:00.000Z") });

    const inRange = materializeOccurrences(
      oneTime,
      new Date("2026-04-01T00:00:00.000Z"),
      new Date("2026-04-30T00:00:00.000Z")
    );
    const before = materializeOccurrences(
      oneTime,
      new Date("2026-05-01T00:00:00.000Z"),
      new Date("2026-05-31T00:00:00.000Z")
    );

    expect(inRange.map((o) => o.id)).toEqual(["item1_2026-04-10"]);
    expect(before).toEqual([]);
  });

  it("stops at the item's endDate", () => {
    const occurrences = materializeOccurrences(
      item({ endDate: ts("2026-04-01T00:00:00.000Z") }),
      new Date("2026-03-01T00:00:00.000Z"),
      new Date("2026-06-30T00:00:00.000Z")
    );

    expect(occurrences.map((o) => o.id)).toEqual(["item1_2026-03-15"]);
  });

  it("returns nothing for an empty or inverted range", () => {
    expect(
      materializeOccurrences(
        item(),
        new Date("2026-05-01T00:00:00.000Z"),
        new Date("2026-04-01T00:00:00.000Z")
      )
    ).toEqual([]);
  });

  it("is idempotent by construction: same input, same ids", () => {
    const run = () =>
      materializeOccurrences(
        item(),
        new Date("2026-01-01T00:00:00.000Z"),
        new Date("2026-06-30T00:00:00.000Z")
      ).map((o) => o.id);

    expect(run()).toEqual(run());
  });
});

describe("occurrenceId", () => {
  it("uses the UTC date portion", () => {
    expect(occurrenceId("abc", new Date("2026-02-03T23:59:59.000Z"))).toBe("abc_2026-02-03");
  });
});

describe("occurrenceToTransaction", () => {
  it("copies money fields verbatim and links back to the item", () => {
    const occurredAt = new Date("2026-03-15T12:00:00.000Z");
    const doc = occurrenceToTransaction(
      item({
        chargedAmount: 60000,
        chargedCurrency: "COP",
        paymentMethodId: "pm1",
        accountId: "acc1",
      }),
      occurredAt
    );

    expect(doc).toEqual({
      userId: "user1",
      domain: "EXPENSE",
      recurrentTransactionId: "item1",
      categoryId: "cat1",
      accountId: "acc1",
      name: "Netflix",
      amount: 15,
      currency: "USD",
      chargedAmount: 60000,
      chargedCurrency: "COP",
      paymentMethodId: "pm1",
      occurredAt,
    });
  });

  it("copies tags and note only when the item says its payments inherit them", () => {
    const at = new Date("2026-03-15T12:00:00.000Z");
    const inherit = occurrenceToTransaction(
      item({ tags: ["t1"], note: "Shared", inheritTags: true, inheritNote: true }),
      at
    );
    expect(inherit).toEqual(expect.objectContaining({ tags: ["t1"], note: "Shared" }));

    const keep = occurrenceToTransaction(item({ tags: ["t1"], note: "Private" }), at);
    expect(keep).not.toHaveProperty("tags");
    expect(keep).not.toHaveProperty("note");
  });

  it("omits absent optional fields instead of writing undefined", () => {
    const doc = occurrenceToTransaction(item(), new Date("2026-03-15T12:00:00.000Z"));
    expect(doc).not.toHaveProperty("chargedAmount");
    expect(doc).not.toHaveProperty("chargedCurrency");
    expect(doc).not.toHaveProperty("paymentMethodId");
    expect(doc).not.toHaveProperty("accountId");
  });
});
