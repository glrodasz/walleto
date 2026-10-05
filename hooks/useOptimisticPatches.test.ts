import { act, renderHook } from "@testing-library/react";
import { pickBooleans, useOptimisticPatches } from "./useOptimisticPatches";

interface Doc {
  id?: string;
  name: string;
  hidden?: boolean;
}

const gym: Doc = { id: "gym", name: "Gym" };
const rent: Doc = { id: "rent", name: "Rent" };

function setup(initial: Doc[]) {
  return renderHook(({ docs }) => useOptimisticPatches(docs), {
    initialProps: { docs: initial },
  });
}

describe("pickBooleans", () => {
  it("keeps only the flags", () => {
    expect(
      pickBooleans({ hiddenFromDashboard: true, name: "x", startDate: "2026-01-01", note: null })
    ).toEqual({ hiddenFromDashboard: true });
  });
});

describe("useOptimisticPatches", () => {
  it("shows a flipped flag before the write resolves", async () => {
    const { result } = setup([gym, rent]);
    let resolve!: () => void;
    let done!: Promise<void>;
    act(() => {
      done = result.current.apply(
        "gym",
        { hidden: true },
        () => new Promise<void>((r) => (resolve = r))
      );
    });
    expect(result.current.docs[0]).toEqual({ ...gym, hidden: true });
    expect(result.current.docs[1]).toBe(rent);
    await act(async () => {
      resolve();
      await done;
    });
    expect(result.current.docs[0].hidden).toBe(true);
  });

  it("keeps the flag while snapshots lag, and lets go once one agrees", async () => {
    const { result, rerender } = setup([gym]);
    await act(() => result.current.apply("gym", { hidden: true }, async () => {}));

    // A late snapshot still carrying the old value does not flip it back.
    rerender({ docs: [{ ...gym }] });
    expect(result.current.docs[0].hidden).toBe(true);

    // The server caught up: from here the snapshot alone decides.
    rerender({ docs: [{ ...gym, hidden: true }] });
    rerender({ docs: [{ ...gym, hidden: false }] });
    expect(result.current.docs[0].hidden).toBe(false);
  });

  it("puts the old value back when the write fails", async () => {
    const { result } = setup([gym]);
    await act(async () => {
      await expect(
        result.current.apply("gym", { hidden: true }, async () => {
          throw new Error("500");
        })
      ).rejects.toThrow("500");
    });
    expect(result.current.docs[0]).toBe(gym);
  });

  it("passes the snapshot through untouched when nothing is pending", () => {
    const docs = [gym, rent];
    const { result } = setup(docs);
    expect(result.current.docs).toBe(docs);
  });
});
