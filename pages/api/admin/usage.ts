import type { NextApiRequest, NextApiResponse } from "next";
import type { Timestamp } from "firebase-admin/firestore";
import auth0 from "../../../lib/auth0";
import admin from "../../../firebase/admin";
import { isAdmin } from "../../../helpers/admin";
import { buildUsageSummary } from "../../../features/admin/helpers/usage";
import type { Auth0User, StoredUser } from "../../../features/admin/helpers/usage";
import { auth0MgmtConfig, fetchAuth0Users } from "../../../features/admin/helpers/auth0Users";
import type { Auth0Status, ItemCounts } from "../../../features/admin/types";

import "../../../firebase/admin";

const COUNTED: Record<keyof ItemCounts, string> = {
  recurring: "recurrentTransactions",
  transactions: "transactions",
  accounts: "accounts",
};

const toDate = (value: unknown) =>
  value && typeof (value as Timestamp).toDate === "function" ? (value as Timestamp).toDate() : null;

async function countItems(db: FirebaseFirestore.Firestore, userId: string): Promise<ItemCounts> {
  const entries = await Promise.all(
    (Object.keys(COUNTED) as (keyof ItemCounts)[]).map(async (key) => {
      const snap = await db.collection(COUNTED[key]).where("userId", "==", userId).count().get();
      return [key, snap.data().count] as const;
    })
  );
  return Object.fromEntries(entries) as unknown as ItemCounts;
}

async function loadAuth0Users(): Promise<{ users: Auth0User[]; status: Auth0Status }> {
  const config = auth0MgmtConfig();
  if (!config) return { users: [], status: "not-configured" };
  try {
    return { users: await fetchAuth0Users(config), status: "ok" };
  } catch (err) {
    // The Firestore half still answers; the page says Auth0 is missing.
    console.error("admin usage: auth0 users failed:", err);
    return { users: [], status: "error" };
  }
}

/**
 * Usage across every account, for the admin dashboard only. Anyone not in
 * ADMIN_USER_IDS gets a 404 — the route doesn't admit it exists. Only counts
 * and dates leave this handler: no amounts, names of items or other content.
 */
export default auth0.withApiAuthRequired(async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await auth0.getSession(req, res);
  if (!session?.user?.sub) return res.status(401).json({ error: "Unauthorized" });
  if (!isAdmin(session.user.sub)) return res.status(404).json({ error: "Not found" });

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const db = admin.firestore();
    const [usersSnap, auth0Result] = await Promise.all([
      db.collection("users").select("createdAt", "lastSeenAt", "onboardingCompleted").get(),
      loadAuth0Users(),
    ]);
    const stored: StoredUser[] = usersSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        createdAt: toDate(data.createdAt),
        lastSeenAt: toDate(data.lastSeenAt),
        onboardingCompleted: data.onboardingCompleted === true,
      };
    });
    const counts = new Map(
      await Promise.all(stored.map(async (u) => [u.id, await countItems(db, u.id)] as const))
    );

    res.setHeader("Cache-Control", "private, no-store");
    return res.status(200).json(
      buildUsageSummary({
        stored,
        auth0Users: auth0Result.users,
        counts,
        auth0: auth0Result.status,
        now: new Date(),
      })
    );
  } catch (err) {
    console.error("admin usage api error:", err);
    return res.status(500).json({ error: "Failed to load usage" });
  }
});
