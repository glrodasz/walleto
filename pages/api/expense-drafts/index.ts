import { randomUUID } from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import auth0 from "../../../lib/auth0";
import admin from "../../../firebase/admin";
import { ExpenseDraftInputSchema } from "../../../schemas";
import { MAX_DRAFTS } from "../../../helpers/drafts";
import type { ExpenseDraft } from "../../../types";

import "../../../firebase/admin";

/**
 * Drafts live in an array on the user's own doc: the client already listens
 * to it, its rules already let only the owner read it, and nothing that adds
 * up money ever reads it.
 */
export default auth0.withApiAuthRequired(async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await auth0.getSession(req, res);
  if (!session?.user?.sub) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const userId = session.user.sub;

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const parsed = ExpenseDraftInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { frequency, dayOfMonth, date, amount, currency, name } = parsed.data;
  const draft: ExpenseDraft = {
    id: randomUUID(),
    name,
    ...(amount !== undefined ? { amount, currency } : {}),
    ...(frequency ? { frequency } : {}),
    // Each cadence keeps only the date part it uses.
    ...(frequency === "MONTHLY" && dayOfMonth !== undefined ? { dayOfMonth } : {}),
    ...(frequency && frequency !== "MONTHLY" && date ? { date } : {}),
    createdAt: new Date().toISOString(),
  };

  const db = admin.firestore();
  const ref = db.collection("users").doc(userId);
  const tooMany = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const drafts = (snap.data()?.expenseDrafts ?? []) as ExpenseDraft[];
    if (drafts.length >= MAX_DRAFTS) return true;
    tx.set(ref, { expenseDrafts: [...drafts, draft] }, { merge: true });
    return false;
  });
  if (tooMany) {
    return res.status(409).json({ error: `You can keep up to ${MAX_DRAFTS} drafts` });
  }
  return res.status(201).json({ id: draft.id });
});
