import type { Firestore, Query, Timestamp } from "firebase-admin/firestore";

/**
 * Every collection that holds one user's data, queried by `userId`. The user
 * doc itself is keyed by the id, not by a field, so it is handled apart.
 * This list is the data inventory in docs/compliance.md: a new per-user
 * collection has to be added here or it is neither exported nor erased.
 */
export const USER_COLLECTIONS = [
  "categories",
  "tags",
  "paymentMethods",
  "accounts",
  "recurrentTransactions",
  "transactions",
  "investmentValuations",
] as const;

export type UserCollection = (typeof USER_COLLECTIONS)[number];

/** Firestore refuses more than 500 writes per batch; leave headroom. */
export const BATCH_LIMIT = 450;

export interface UserDataExport {
  exportedAt: string;
  userId: string;
  user: Record<string, unknown> | null;
  collections: Record<UserCollection, Record<string, unknown>[]>;
}

const isTimestamp = (v: unknown): v is Timestamp =>
  typeof v === "object" && v !== null && typeof (v as Timestamp).toDate === "function";

/** Firestore Timestamps become ISO strings so the file reads without the SDK. */
export function serializeValue(value: unknown): unknown {
  if (isTimestamp(value)) return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(serializeValue);
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, serializeValue(v)])
    );
  }
  return value;
}

const ownedBy = (db: Firestore, collection: UserCollection, userId: string): Query =>
  db.collection(collection).where("userId", "==", userId);

/** Everything the app holds about one person, ready to be sent as JSON. */
export async function collectUserData(db: Firestore, userId: string): Promise<UserDataExport> {
  const userSnap = await db.collection("users").doc(userId).get();
  const collections = {} as UserDataExport["collections"];
  for (const name of USER_COLLECTIONS) {
    const snap = await ownedBy(db, name, userId).get();
    collections[name] = snap.docs.map((d) => ({
      id: d.id,
      ...(serializeValue(d.data()) as Record<string, unknown>),
    }));
  }
  return {
    exportedAt: new Date().toISOString(),
    userId,
    user: userSnap.exists ? (serializeValue(userSnap.data()) as Record<string, unknown>) : null,
    collections,
  };
}

export type DeletedCounts = Record<UserCollection | "users", number>;

/**
 * Hard-deletes every document the person owns, then the user doc. This is the
 * one place the app deletes for real (AGENTS.md §3): erasure on request means
 * the whole graph goes, so nothing is left dangling for a soft delete to
 * protect. Batched so any size of ledger fits under Firestore's write limit.
 */
export async function deleteUserData(db: Firestore, userId: string): Promise<DeletedCounts> {
  const counts = { users: 0 } as DeletedCounts;
  for (const name of USER_COLLECTIONS) {
    const snap = await ownedBy(db, name, userId).get();
    for (let i = 0; i < snap.docs.length; i += BATCH_LIMIT) {
      const batch = db.batch();
      for (const d of snap.docs.slice(i, i + BATCH_LIMIT)) batch.delete(d.ref);
      await batch.commit();
    }
    counts[name] = snap.docs.length;
  }
  const userRef = db.collection("users").doc(userId);
  if ((await userRef.get()).exists) {
    await userRef.delete();
    counts.users = 1;
  }
  return counts;
}
