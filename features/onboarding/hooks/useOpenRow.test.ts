import { renderHook, act } from "@testing-library/react";
import { useOpenRow } from "./useOpenRow";
import type { DraftRow } from "../../../hooks/useDraftRows";

type Args = { rows: DraftRow[]; invalid: string | null; attempt: number };

function setup(initial: Args) {
  return renderHook(({ rows, invalid, attempt }: Args) => useOpenRow(rows, invalid, attempt), {
    initialProps: initial,
  });
}

const blank = { key: "a" };
const saved = [
  { key: "s1", id: "pm1" },
  { key: "s2", id: "pm2" },
];

describe("useOpenRow", () => {
  it("opens the blank row of a fresh step", () => {
    const { result } = setup({ rows: [blank], invalid: null, attempt: 0 });
    expect(result.current.openKey).toBe("a");
  });

  it("starts as a closed wallet when every method is saved", () => {
    const { result, rerender } = setup({ rows: [blank], invalid: null, attempt: 0 });

    // Hydration swaps the placeholder for the saved rows.
    rerender({ rows: saved, invalid: null, attempt: 0 });

    expect(result.current.openKey).toBeNull();
  });

  it("opens a row added at the end, closing the one that was open", () => {
    const { result, rerender } = setup({ rows: saved, invalid: null, attempt: 0 });
    act(() => result.current.toggle("s1"));
    expect(result.current.openKey).toBe("s1");

    rerender({ rows: [...saved, { key: "n" }], invalid: null, attempt: 0 });

    expect(result.current.openKey).toBe("n");
  });

  it("toggles one at a time and closes all", () => {
    const { result } = setup({ rows: saved, invalid: null, attempt: 0 });

    act(() => result.current.toggle("s1"));
    act(() => result.current.toggle("s2"));
    expect(result.current.openKey).toBe("s2");

    act(() => result.current.toggle("s2"));
    expect(result.current.openKey).toBeNull();

    act(() => result.current.toggle("s1"));
    act(() => result.current.close());
    expect(result.current.openKey).toBeNull();
  });

  it("falls back to the default when the open row is removed", () => {
    const rows = [...saved, { key: "n" }];
    const { result, rerender } = setup({ rows, invalid: null, attempt: 0 });
    act(() => result.current.toggle("s1"));

    rerender({ rows: [saved[1], { key: "n" }], invalid: null, attempt: 0 });

    expect(result.current.openKey).toBe("n");
  });

  it("opens the first bad row on every failed save, even one already seen", () => {
    const { result, rerender } = setup({ rows: saved, invalid: null, attempt: 0 });

    rerender({ rows: saved, invalid: "s2", attempt: 1 });
    expect(result.current.openKey).toBe("s2");

    act(() => result.current.close());
    rerender({ rows: saved, invalid: "s2", attempt: 2 });
    expect(result.current.openKey).toBe("s2");
  });
});
