import type { Firestore } from "firebase-admin/firestore";
import {
  BATCH_LIMIT,
  USER_COLLECTIONS,
  collectUserData,
  deleteUserData,
  serializeValue,
} from "./userData";

const ts = (iso: string) => ({ toDate: () => new Date(iso) });

/** A fake Firestore holding N docs per collection, all owned by the user. */
function fakeDb(counts: Partial<Record<string, number>>, userExists = true) {
  const batches: { deletes: number; committed: boolean }[] = [];
  const deletedUser = jest.fn().mockResolvedValue(undefined);
  const where = jest.fn();
  const db = {
    collection: jest.fn((name: string) => ({
      where: (...args: unknown[]) => {
        where(name, ...args);
        return {
          get: async () => ({
            docs: Array.from({ length: counts[name] ?? 0 }, (_, i) => ({
              id: `${name}-${i}`,
              ref: { id: `${name}-${i}` },
              data: () => ({ userId: "user1", n: i, createdAt: ts("2026-01-01T00:00:00.000Z") }),
            })),
          }),
        };
      },
      doc: () => ({
        get: async () => ({ exists: userExists, data: () => ({ mainCurrency: "USD" }) }),
        delete: deletedUser,
      }),
    })),
    batch: jest.fn(() => {
      const entry = { deletes: 0, committed: false };
      batches.push(entry);
      return {
        delete: () => {
          entry.deletes += 1;
        },
        commit: async () => {
          entry.committed = true;
        },
      };
    }),
  };
  return { db: db as unknown as Firestore, batches, deletedUser, where };
}

describe("serializeValue", () => {
  it("turns Timestamps into ISO strings, recursively", () => {
    expect(
      serializeValue({
        a: ts("2026-03-04T05:06:07.000Z"),
        b: [ts("2026-01-01T00:00:00.000Z"), 2, "x"],
        c: { d: null, e: true },
      })
    ).toEqual({
      a: "2026-03-04T05:06:07.000Z",
      b: ["2026-01-01T00:00:00.000Z", 2, "x"],
      c: { d: null, e: true },
    });
  });
});

describe("collectUserData", () => {
  it("gathers the user doc and every per-user collection, filtered by userId", async () => {
    const { db, where } = fakeDb({ transactions: 2, tags: 1 });
    const out = await collectUserData(db, "user1");

    expect(out.userId).toBe("user1");
    expect(out.user).toEqual({ mainCurrency: "USD" });
    expect(Object.keys(out.collections).sort()).toEqual([...USER_COLLECTIONS].sort());
    expect(out.collections.transactions).toEqual([
      { id: "transactions-0", userId: "user1", n: 0, createdAt: "2026-01-01T00:00:00.000Z" },
      { id: "transactions-1", userId: "user1", n: 1, createdAt: "2026-01-01T00:00:00.000Z" },
    ]);
    expect(out.collections.categories).toEqual([]);
    for (const name of USER_COLLECTIONS) {
      expect(where).toHaveBeenCalledWith(name, "userId", "==", "user1");
    }
  });

  it("reports a missing user doc as null", async () => {
    const { db } = fakeDb({}, false);
    expect((await collectUserData(db, "user1")).user).toBeNull();
  });
});

describe("deleteUserData", () => {
  it("deletes every owned doc in batches under the limit, then the user doc", async () => {
    const { db, batches, deletedUser } = fakeDb({ transactions: BATCH_LIMIT + 10, tags: 3 });
    const counts = await deleteUserData(db, "user1");

    expect(counts.transactions).toBe(BATCH_LIMIT + 10);
    expect(counts.tags).toBe(3);
    expect(counts.categories).toBe(0);
    expect(counts.users).toBe(1);
    expect(batches.every((b) => b.committed && b.deletes <= BATCH_LIMIT)).toBe(true);
    expect(batches.reduce((n, b) => n + b.deletes, 0)).toBe(BATCH_LIMIT + 13);
    expect(deletedUser).toHaveBeenCalledTimes(1);
  });

  it("skips the user doc when it never existed", async () => {
    const { db, deletedUser } = fakeDb({}, false);
    const counts = await deleteUserData(db, "user1");
    expect(counts.users).toBe(0);
    expect(deletedUser).not.toHaveBeenCalled();
  });
});
