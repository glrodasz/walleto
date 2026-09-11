import { paginate } from "./paginate";

const rows = Array.from({ length: 30 }, (_, i) => i + 1);

describe("paginate", () => {
  it("slices a page and reports the count", () => {
    expect(paginate(rows, 1, 25)).toEqual({ rows: rows.slice(0, 25), page: 1, pageCount: 2 });
    expect(paginate(rows, 2, 25)).toEqual({ rows: rows.slice(25), page: 2, pageCount: 2 });
  });

  it("clamps out-of-range pages and copes with an empty list", () => {
    expect(paginate(rows, 9, 25).page).toBe(2);
    expect(paginate(rows, 0, 25).page).toBe(1);
    expect(paginate([], 3, 25)).toEqual({ rows: [], page: 1, pageCount: 1 });
  });
});
