import { Cell } from "./chartCell";

describe("chartCell", () => {
  it("keeps the name recharts matches children by", () => {
    // `dynamic` sets "LoadableComponent", which made recharts ignore every
    // <Cell> the charts passed — the selected-month highlight did nothing.
    expect(Cell.displayName).toBe("Cell");
  });
});
