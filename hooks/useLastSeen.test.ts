import { renderHook } from "@testing-library/react";

const updateDocMock = jest.fn(() => Promise.resolve());

jest.mock("../firebase/client", () => ({ db: {} }));
jest.mock("firebase/firestore", () => ({
  doc: (_db: unknown, ...path: string[]) => path.join("/"),
  updateDoc: (...args: unknown[]) => updateDocMock(...(args as [])),
  serverTimestamp: () => "SERVER_TIMESTAMP",
}));

import type { Timestamp } from "firebase/firestore";
import { isNewDay, resetLastSeen, useLastSeen } from "./useLastSeen";

const stamp = (d: Date) => ({ toMillis: () => d.getTime() }) as unknown as Timestamp;

beforeEach(() => {
  updateDocMock.mockClear();
  resetLastSeen();
});

describe("isNewDay", () => {
  const now = new Date("2026-10-23T12:00:00Z");
  it("is a new day when never seen or seen on an earlier UTC day", () => {
    expect(isNewDay(null, now)).toBe(true);
    expect(isNewDay(new Date("2026-10-22T23:59:00Z"), now)).toBe(true);
    expect(isNewDay(new Date("2026-10-23T00:01:00Z"), now)).toBe(false);
  });
});

describe("useLastSeen", () => {
  it("stamps the user doc when it hasn't been seen today", () => {
    renderHook(() => useLastSeen("user1", null, true));
    expect(updateDocMock).toHaveBeenCalledWith("users/user1", { lastSeenAt: "SERVER_TIMESTAMP" });
  });

  it("writes only once a day, even while the stamp reads back as null", () => {
    const { rerender } = renderHook(({ seen }) => useLastSeen("user1", seen, true), {
      initialProps: { seen: null as Timestamp | null },
    });
    rerender({ seen: null });
    expect(updateDocMock).toHaveBeenCalledTimes(1);
  });

  it("does nothing when already seen today, or before the doc loads", () => {
    renderHook(() => useLastSeen("user1", stamp(new Date()), true));
    renderHook(() => useLastSeen("user2", null, false));
    renderHook(() => useLastSeen(undefined, null, true));
    expect(updateDocMock).not.toHaveBeenCalled();
  });
});
