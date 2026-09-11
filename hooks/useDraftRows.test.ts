import { renderHook, act } from "@testing-library/react";
import { useDraftRows } from "./useDraftRows";
import type { DraftRow } from "./useDraftRows";

interface Row extends DraftRow {
  name: string;
}

const makeEmpty = () => ({ name: "" });

describe("useDraftRows", () => {
  it("starts with a single blank row", () => {
    const { result } = renderHook(() => useDraftRows<Row>(makeEmpty));
    expect(result.current.rows).toHaveLength(1);
    expect(result.current.rows[0].name).toBe("");
    expect(result.current.rows[0].id).toBeUndefined();
  });

  it("gives every row a unique key", () => {
    const { result } = renderHook(() => useDraftRows<Row>(makeEmpty));
    act(() => result.current.add());
    act(() => result.current.add());
    const keys = result.current.rows.map((r) => r.key);
    expect(new Set(keys).size).toBe(3);
  });

  it("can pre-fill an added row", () => {
    const { result } = renderHook(() => useDraftRows<Row>(makeEmpty));
    act(() => result.current.add({ name: "Rent" }));
    expect(result.current.rows[1].name).toBe("Rent");
    expect(result.current.rows[1].key).toBeDefined();
  });

  it("updates a row by key without touching its siblings", () => {
    const { result } = renderHook(() => useDraftRows<Row>(makeEmpty));
    act(() => result.current.add());
    const [first, second] = result.current.rows;

    act(() => result.current.update(second.key, { name: "Rent" }));

    expect(result.current.rows.find((r) => r.key === first.key)!.name).toBe("");
    expect(result.current.rows.find((r) => r.key === second.key)!.name).toBe("Rent");
  });

  it("never drops below one row", () => {
    const { result } = renderHook(() => useDraftRows<Row>(makeEmpty));
    act(() => result.current.removeAt(result.current.rows[0].key));
    expect(result.current.rows).toHaveLength(1);
    expect(result.current.rows[0].name).toBe("");
  });

  it("hydrates from saved rows once they load", () => {
    const saved = [
      { id: "a", name: "Salary" },
      { id: "b", name: "Freelance" },
    ];
    const { result, rerender } = renderHook(
      ({ ready }) => useDraftRows<Row>(makeEmpty, { ready, rows: saved }),
      { initialProps: { ready: false } }
    );

    expect(result.current.rows).toHaveLength(1);

    rerender({ ready: true });

    expect(result.current.rows.map((r) => r.name)).toEqual(["Salary", "Freelance"]);
    // Carrying the id forward is what stops a re-save from duplicating them.
    expect(result.current.rows.map((r) => r.id)).toEqual(["a", "b"]);
  });

  it("does not re-hydrate over in-progress edits", () => {
    const saved = [{ id: "a", name: "Salary" }];
    const { result, rerender } = renderHook(
      ({ ready }) => useDraftRows<Row>(makeEmpty, { ready, rows: saved }),
      { initialProps: { ready: false } }
    );

    rerender({ ready: true });
    act(() => result.current.update(result.current.rows[0].key, { name: "Edited" }));

    // A later snapshot must not clobber what the user typed.
    rerender({ ready: true });
    expect(result.current.rows[0].name).toBe("Edited");
  });

  it("keeps the blank row when there is nothing saved yet", () => {
    const { result, rerender } = renderHook(
      ({ ready }) => useDraftRows<Row>(makeEmpty, { ready, rows: [] }),
      { initialProps: { ready: false } }
    );

    rerender({ ready: true });
    expect(result.current.rows).toHaveLength(1);
    expect(result.current.rows[0].id).toBeUndefined();
  });
});
