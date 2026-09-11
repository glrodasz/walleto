import { formatList } from "./formatList";

describe("formatList", () => {
  it("returns the single item unchanged", () => {
    expect(formatList(["Netflix"])).toBe("Netflix");
  });

  it("joins two items with 'and'", () => {
    expect(formatList(["Netflix", "Spotify"])).toBe("Netflix and Spotify");
  });

  it("comma-separates 3+ items with a trailing 'and'", () => {
    expect(formatList(["Netflix", "Spotify", "iCloud"])).toBe("Netflix, Spotify and iCloud");
  });

  it("returns an empty string for an empty list", () => {
    expect(formatList([])).toBe("");
  });
});
