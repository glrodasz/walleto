/** One person on the admin dashboard. Dates travel as ISO strings. */
export interface AdminUserRow {
  id: string;
  /** From Auth0; null when the Management API isn't configured. */
  email: string | null;
  name: string | null;
  signedUpAt: string | null;
  lastLoginAt: string | null;
  logins: number | null;
  /** The last day the app was opened (the user doc's `lastSeenAt`). */
  lastSeenAt: string | null;
  /** The later of `lastSeenAt` and `lastLoginAt`. */
  lastActiveAt: string | null;
  onboarded: boolean;
  counts: ItemCounts;
}

export interface ItemCounts {
  recurring: number;
  transactions: number;
  accounts: number;
}

export interface WeekCount {
  /** Monday of the week, "2026-10-19" (UTC). */
  weekStart: string;
  count: number;
}

export type Auth0Status = "ok" | "not-configured" | "error";

export interface UsageSummary {
  generatedAt: string;
  totals: {
    users: number;
    onboarded: number;
    signups7d: number;
    signups30d: number;
    /** Active in the last 1 / 7 / 30 days. */
    dau: number;
    wau: number;
    mau: number;
  };
  weeklySignups: WeekCount[];
  /** Most recently active first. */
  users: AdminUserRow[];
  auth0: Auth0Status;
}
