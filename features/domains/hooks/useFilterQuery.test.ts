import { renderHook } from "@testing-library/react";
import { useFilterQuery } from "./useFilterQuery";
import { EMPTY_FILTERS } from "../helpers/transactionFilters";

const replace = jest.fn();
let query: Record<string, string> = {};
let isReady = true;

jest.mock("next/router", () => ({
  useRouter: () => ({ pathname: "/expenses", query, isReady, replace }),
}));

describe("useFilterQuery", () => {
  beforeEach(() => {
    replace.mockClear();
    query = {};
    isReady = true;
    globalThis.history.replaceState(null, "", "/expenses#activity");
  });

  it("reads the filters from the query", () => {
    query = { month: "2026-08", q: "rent", sort: "amount-asc" };
    const { result } = renderHook(() => useFilterQuery());
    expect(result.current.initial).toEqual({
      ...EMPTY_FILTERS,
      search: "rent",
      sort: { by: "amount", dir: "asc" },
    });
  });

  it("has nothing to offer until the router is ready", () => {
    isReady = false;
    query = { q: "rent" };
    const { result } = renderHook(() => useFilterQuery());
    expect(result.current.initial).toBeUndefined();
    result.current.write({ ...EMPTY_FILTERS, search: "x" });
    expect(replace).not.toHaveBeenCalled();
  });

  it("writes the filters, keeping the month and the hash", () => {
    query = { month: "2026-08", q: "old" };
    const { result } = renderHook(() => useFilterQuery());
    result.current.write({ ...EMPTY_FILTERS, search: "netflix", categoryId: "fun" });
    expect(replace).toHaveBeenCalledWith(
      {
        pathname: "/expenses",
        query: { month: "2026-08", q: "netflix", category: "fun" },
        hash: "activity",
      },
      undefined,
      { shallow: true, scroll: false }
    );
  });

  it("clears the params on reset and skips writes that change nothing", () => {
    query = { month: "2026-08", q: "rent" };
    const { result } = renderHook(() => useFilterQuery());
    result.current.write({ ...EMPTY_FILTERS, search: "rent" });
    expect(replace).not.toHaveBeenCalled();
    result.current.write(EMPTY_FILTERS);
    expect(replace).toHaveBeenCalledWith(
      expect.objectContaining({ query: { month: "2026-08" } }),
      undefined,
      expect.anything()
    );
  });
});
