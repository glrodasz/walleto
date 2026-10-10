import { edgeFade, snapTarget } from "./scrollRow";

const port = { start: 100, end: 1100 };

describe("edgeFade", () => {
  it("leaves an item clear of both edges unmasked", () => {
    expect(edgeFade({ start: 400, end: 700 }, port, true, true, 48)).toBeNull();
  });

  it("fades the end side of an item running past the right edge", () => {
    expect(edgeFade({ start: 900, end: 1200 }, port, false, true, 48)).toEqual([0, 0, 152, 200]);
  });

  it("fades the start side of an item running past the left edge", () => {
    expect(edgeFade({ start: 50, end: 350 }, port, true, false, 48)).toEqual([50, 98, 300, 300]);
  });

  it("doesn't fade an edge with nothing more to scroll", () => {
    expect(edgeFade({ start: 50, end: 350 }, port, false, true, 48)).toBeNull();
    expect(edgeFade({ start: 900, end: 1200 }, port, true, false, 48)).toBeNull();
  });

  it("fades both sides of an item wider than the port", () => {
    expect(edgeFade({ start: 0, end: 1200 }, port, true, true, 48)).toEqual([100, 148, 1052, 1100]);
  });
});

describe("snapTarget", () => {
  const starts = [0, 316, 632, 948, 1264];

  it("settles on the nearest item start", () => {
    expect(snapTarget(starts, 400, 900)).toBe(316);
    expect(snapTarget(starts, 500, 900)).toBe(632);
  });

  it("clamps item starts past the end to the end of the row", () => {
    expect(snapTarget(starts, 880, 900)).toBe(900);
  });

  it("never goes before the start", () => {
    expect(snapTarget(starts, -200, 900)).toBe(0);
  });
});
