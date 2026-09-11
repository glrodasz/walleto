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
});
