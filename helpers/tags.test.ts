import { normaliseTagName, sortTagsByName, tagKey, tagNames } from "./tags";

describe("normaliseTagName / tagKey", () => {
  it("removes whitespace but keeps the case for display", () => {
    expect(normaliseTagName("  Trip 2026 ")).toBe("Trip2026");
    expect(normaliseTagName("work\tlunch")).toBe("worklunch");
  });

  it("keys case-insensitively, so differently cased spellings collide", () => {
    expect(tagKey("Trip 2026")).toBe("trip2026");
    expect(tagKey("TRIP 2026")).toBe(tagKey("trip2026"));
  });
});

describe("tagNames", () => {
  const tags = [
    { id: "a", name: "Trip2026" },
    { id: "b", name: "Work" },
  ];

  it("resolves ids in order and drops unknown ones", () => {
    expect(tagNames(["b", "gone", "a"], tags)).toEqual(["Work", "Trip2026"]);
    expect(tagNames(undefined, tags)).toEqual([]);
    expect(tagNames([], tags)).toEqual([]);
  });
});

describe("sortTagsByName", () => {
  it("sorts case-insensitively without mutating", () => {
    const input = [{ name: "work" }, { name: "Admin" }, { name: "beach" }];
    expect(sortTagsByName(input).map((t) => t.name)).toEqual(["Admin", "beach", "work"]);
    expect(input[0].name).toBe("work");
  });
});
