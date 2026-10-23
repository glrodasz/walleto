import { useEffect } from "react";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import type { Timestamp } from "firebase/firestore";
import { db } from "../firebase/client";

const utcDay = (d: Date) => d.toISOString().slice(0, 10);

/** True when `lastSeen` falls on an earlier UTC day than `now` (or was never set). */
export function isNewDay(lastSeen: Date | null, now: Date): boolean {
  return !lastSeen || utcDay(lastSeen) < utcDay(now);
}

// One write per user per day, even while the pending server timestamp reads
// back as null on the next snapshot.
let touched: string | null = null;

/** Test hook: forget what was written. */
export function resetLastSeen() {
  touched = null;
}

/**
 * Stamps `lastSeenAt` on the user doc the first time the app opens each UTC
 * day — what the admin dashboard counts as daily / weekly / monthly active.
 * Auth0's last login can't answer that: a session lasts for days.
 */
export function useLastSeen(
  sub: string | undefined,
  lastSeenAt: Timestamp | null | undefined,
  loaded: boolean
) {
  const lastSeenMs = lastSeenAt?.toMillis?.() ?? null;
  useEffect(() => {
    if (!sub || !loaded) return;
    const now = new Date();
    const key = `${sub}:${utcDay(now)}`;
    if (touched === key) return;
    if (!isNewDay(lastSeenMs === null ? null : new Date(lastSeenMs), now)) return;
    touched = key;
    updateDoc(doc(db, "users", sub), { lastSeenAt: serverTimestamp() }).catch((err) => {
      console.error("useLastSeen update error:", err);
    });
  }, [sub, lastSeenMs, loaded]);
}
