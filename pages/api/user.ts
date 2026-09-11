import type { NextApiRequest, NextApiResponse } from "next";
import auth0 from "../../lib/auth0";
import admin from "../../firebase/admin";
import { UserUpdateSchema } from "../../schemas";

import "../../firebase/admin";

export default auth0.withApiAuthRequired(async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await auth0.getSession(req, res);
  if (!session?.user?.sub) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const userId = session.user.sub;
  const db = admin.firestore();
  const ref = db.collection("users").doc(userId);

  if (req.method === "GET") {
    const snap = await ref.get();
    if (!snap.exists) {
      return res.status(404).json({ error: "Not found" });
    }
    return res.status(200).json({ id: userId, ...snap.data() });
  }

  if (req.method === "PATCH") {
    const parsed = UserUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    // The user doc is created lazily by /api/firebase, so a PATCH can land
    // before it exists — merge instead of update to cover that.
    await ref.set({ ...parsed.data }, { merge: true });
    return res.status(200).json({ id: userId });
  }

  res.setHeader("Allow", "GET, PATCH");
  return res.status(405).json({ error: "Method not allowed" });
});
