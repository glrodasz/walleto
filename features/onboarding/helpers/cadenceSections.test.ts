import { CADENCE_SECTIONS, sectionFor } from "./cadenceSections";
import type { Frequency } from "../../../types";

const ALL: Frequency[] = ["ONE_TIME", "WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"];

describe("cadenceSections", () => {
  it("covers every frequency exactly once", () => {
    const seen = CADENCE_SECTIONS.flatMap((s) => s.frequencies);
    expect([...seen].sort()).toEqual([...ALL].sort());
  });

  it("puts each frequency in the section that declares it", () => {
    expect(sectionFor("MONTHLY").id).toBe("monthly");
    expect(sectionFor("YEARLY").id).toBe("yearly");
    expect(sectionFor("WEEKLY").id).toBe("other");
    expect(sectionFor("QUARTERLY").id).toBe("other");
    expect(sectionFor("ONE_TIME").id).toBe("oneTime");
  });

  it("only the one-time section is not backfillable", () => {
    expect(CADENCE_SECTIONS.filter((s) => !s.recurring).map((s) => s.id)).toEqual(["oneTime"]);
  });

  it("each section's default frequency belongs to it", () => {
    for (const s of CADENCE_SECTIONS) {
      expect(s.frequencies).toContain(s.defaultFrequency);
    }
  });

  it("has exactly one primary section, and it is the monthly one, first", () => {
    expect(CADENCE_SECTIONS.filter((s) => s.primary).map((s) => s.id)).toEqual(["monthly"]);
    expect(CADENCE_SECTIONS[0].primary).toBe(true);
  });

  it("names the cadence on every add chip", () => {
    const label = (id: string, more = false) =>
      CADENCE_SECTIONS.find((s) => s.id === id)!.addLabel("expense", more);
    expect(label("monthly")).toBe("Add a monthly expense");
    expect(label("yearly", true)).toBe("Add another yearly expense");
    expect(label("other")).toBe("Add an expense on another cadence");
    expect(label("oneTime")).toBe("Add a one-time expense");
  });
});
