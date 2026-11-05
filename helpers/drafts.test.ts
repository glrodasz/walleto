import { draftSchedule, sortDrafts } from "./drafts";
import type { ExpenseDraft } from "../types";

const base: ExpenseDraft = { id: "d1", name: "Netflix", createdAt: "2026-11-05T12:00:00.000Z" };

describe("draftSchedule", () => {
  it("opens a draft with no cadence as monthly on the day it was jotted down", () => {
    expect(draftSchedule(base)).toEqual({
      frequency: "MONTHLY",
      dayOfMonth: 5,
      month: 10,
      date: "2026-11-05",
    });
  });

  it("keeps a monthly draft's payment day", () => {
    expect(draftSchedule({ ...base, frequency: "MONTHLY", dayOfMonth: 14 }).dayOfMonth).toBe(14);
  });

  it("reads a yearly draft's month and day from its date", () => {
    const s = draftSchedule({ ...base, frequency: "YEARLY", date: "2027-02-14" });
    expect(s).toMatchObject({ frequency: "YEARLY", dayOfMonth: 14, month: 1 });
  });

  it("keeps a one-time draft's date", () => {
    const s = draftSchedule({ ...base, frequency: "ONE_TIME", date: "2026-11-20" });
    expect(s).toMatchObject({ frequency: "ONE_TIME", date: "2026-11-20" });
  });
});

describe("sortDrafts", () => {
  it("lists drafts oldest first and copes with none", () => {
    const later = { ...base, id: "d2", createdAt: "2026-11-06T00:00:00.000Z" };
    expect(sortDrafts([later, base]).map((d) => d.id)).toEqual(["d1", "d2"]);
    expect(sortDrafts(undefined)).toEqual([]);
  });
});
