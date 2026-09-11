import { byCreatedAt, createdAtMillis } from "./sortByCreatedAt";

const ts = (seconds: number) => ({
  seconds,
  nanoseconds: 0,
  toDate: () => new Date(seconds * 1000),
});

describe("createdAtMillis", () => {
  it("converts a resolved timestamp to milliseconds", () => {
    expect(createdAtMillis({ createdAt: ts(1_700_000) })).toBe(1_700_000_000);
  });

  it("treats a pending serverTimestamp as newest", () => {
    // Firestore echoes createdAt as null locally until the server resolves it.
    expect(createdAtMillis({ createdAt: null })).toBe(Number.MAX_SAFE_INTEGER);
    expect(createdAtMillis({})).toBe(Number.MAX_SAFE_INTEGER);
  });
});

describe("byCreatedAt", () => {
  it("sorts oldest first", () => {
    const rows = [{ createdAt: ts(300) }, { createdAt: ts(100) }, { createdAt: ts(200) }];
    expect(rows.sort(byCreatedAt).map((r) => r.createdAt.seconds)).toEqual([100, 200, 300]);
  });

  it("keeps a pending write at the end rather than jumping to the top", () => {
    const pending = { createdAt: null };
    const rows = [{ createdAt: ts(300) }, pending, { createdAt: ts(100) }];
    expect(rows.sort(byCreatedAt).indexOf(pending)).toBe(2);
  });
});
