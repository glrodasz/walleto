import type { NextApiRequest, NextApiResponse } from "next";
import auth0 from "../../../lib/auth0";
import admin from "../../../firebase/admin";
import type { ExpenseDraft } from "../../../types";

import "../../../firebase/admin";

/** DELETE: discard a draft, or drop it once it became a real expense. */
export default auth0.withApiAuthRequired(async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await auth0.getSession(req, res);
  if (!session?.user?.sub) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const userId = session.user.sub;
  const { id } = req.query;
  if (typeof id !== "string") {
    return res.status(400).json({ error: "Invalid id" });
  }
  if (req.method !== "DELETE") {
    res.setHeader("Allow", "DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const db = admin.firestore();
  const ref = db.collection("users").doc(userId);
  const found = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const drafts = (snap.data()?.expenseDrafts ?? []) as ExpenseDraft[];
    const rest = drafts.filter((d) => d.id !== id);
    if (rest.length === drafts.length) return false;
    tx.update(ref, { expenseDrafts: rest });
    return true;
  });
  if (!found) {
    return res.status(404).json({ error: "Not found" });
  }
  return res.status(200).json({ id });
});
