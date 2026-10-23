import type { AdminUserRow, Auth0Status, ItemCounts, UsageSummary, WeekCount } from "../types";

export interface StoredUser {
  id: string;
  createdAt: Date | null;
  lastSeenAt: Date | null;
  onboardingCompleted: boolean;
}

export interface Auth0User {
  id: string;
  email: string | null;
  name: string | null;
  createdAt: Date | null;
  lastLoginAt: Date | null;
  logins: number;
}

const DAY = 24 * 60 * 60 * 1000;
export const SIGNUP_WEEKS = 12;
const NO_COUNTS: ItemCounts = { recurring: 0, transactions: 0, accounts: 0 };

const iso = (d: Date | null) => (d ? d.toISOString() : null);
const latest = (a: Date | null, b: Date | null) => (!a ? b : !b ? a : a > b ? a : b);

/** Monday 00:00 UTC of the week holding `d`. */
export function weekStartUtc(d: Date): Date {
  const day = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const sinceMonday = (day.getUTCDay() + 6) % 7;
  return new Date(day.getTime() - sinceMonday * DAY);
}

export function weeklySignups(dates: Date[], now: Date, weeks = SIGNUP_WEEKS): WeekCount[] {
  const current = weekStartUtc(now).getTime();
  const buckets = Array.from({ length: weeks }, (_, i) => ({
    start: current - (weeks - 1 - i) * 7 * DAY,
    count: 0,
  }));
  for (const d of dates) {
    const start = weekStartUtc(d).getTime();
    const bucket = buckets.find((b) => b.start === start);
    if (bucket) bucket.count += 1;
  }
  return buckets.map((b) => ({
    weekStart: new Date(b.start).toISOString().slice(0, 10),
    count: b.count,
  }));
}

/**
 * Joins the Firestore user docs with their Auth0 accounts and item counts.
 * A person can exist on one side only (an Auth0 login that never reached the
 * app, or a doc whose account was deleted), so the rows are the union.
 */
export function buildUsageSummary({
  stored,
  auth0Users,
  counts,
  auth0,
  now,
}: {
  stored: StoredUser[];
  auth0Users: Auth0User[];
  counts: Map<string, ItemCounts>;
  auth0: Auth0Status;
  now: Date;
}): UsageSummary {
  const byIdStored = new Map(stored.map((u) => [u.id, u]));
  const byIdAuth0 = new Map(auth0Users.map((u) => [u.id, u]));
  const ids = Array.from(new Set([...byIdStored.keys(), ...byIdAuth0.keys()]));

  const people = ids.map((id) => {
    const doc = byIdStored.get(id);
    const account = byIdAuth0.get(id);
    const signedUpAt = doc?.createdAt ?? account?.createdAt ?? null;
    const lastSeenAt = doc?.lastSeenAt ?? null;
    const lastLoginAt = account?.lastLoginAt ?? null;
    const lastActiveAt = latest(lastSeenAt, lastLoginAt);
    const row: AdminUserRow = {
      id,
      email: account?.email ?? null,
      name: account?.name ?? null,
      signedUpAt: iso(signedUpAt),
      lastLoginAt: iso(lastLoginAt),
      logins: account ? account.logins : null,
      lastSeenAt: iso(lastSeenAt),
      lastActiveAt: iso(lastActiveAt),
      onboarded: doc?.onboardingCompleted ?? false,
      counts: counts.get(id) ?? NO_COUNTS,
    };
    return { row, signedUpAt, lastActiveAt };
  });

  const within = (d: Date | null, days: number) =>
    d !== null && now.getTime() - d.getTime() < days * DAY;
  const activeWithin = (days: number) => people.filter((p) => within(p.lastActiveAt, days)).length;
  const signedUpWithin = (days: number) => people.filter((p) => within(p.signedUpAt, days)).length;

  const users = people
    .map((p) => p.row)
    .sort((a, b) => (b.lastActiveAt ?? "").localeCompare(a.lastActiveAt ?? ""));

  return {
    generatedAt: now.toISOString(),
    totals: {
      users: people.length,
      onboarded: users.filter((u) => u.onboarded).length,
      signups7d: signedUpWithin(7),
      signups30d: signedUpWithin(30),
      dau: activeWithin(1),
      wau: activeWithin(7),
      mau: activeWithin(30),
    },
    weeklySignups: weeklySignups(
      people.flatMap((p) => (p.signedUpAt ? [p.signedUpAt] : [])),
      now
    ),
    users,
    auth0,
  };
}
