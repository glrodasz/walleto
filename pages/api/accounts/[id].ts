import type { NextApiRequest, NextApiResponse } from "next";
import auth0 from "../../../lib/auth0";
import admin from "../../../firebase/admin";
import { AccountUpdateSchema } from "../../../schemas";

import "../../../firebase/admin";

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

  const db = admin.firestore();
  const ref = db.collection("accounts").doc(id);
  const snap = await ref.get();

  if (!snap.exists) {
    return res.status(404).json({ error: "Not found" });
  }
  if (snap.data()?.userId !== userId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (req.method === "PATCH") {
    const parsed = AccountUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { name, provider, currency, interestRate, archived } = parsed.data;

    const del = admin.firestore.FieldValue.delete();
    await ref.update({
      ...(name !== undefined ? { name } : {}),
      ...(provider !== undefined ? { provider: provider || del } : {}),
      ...(currency !== undefined ? { currency } : {}),
      ...(interestRate !== undefined ? { interestRate: interestRate ?? del } : {}),
      ...(archived !== undefined ? { archived } : {}),
    });
    return res.status(200).json({ id });
  }

  if (req.method === "DELETE") {
    // Soft-delete so transactions filed under the account still resolve it.
    await ref.update({ archived: true });
    return res.status(200).json({ id });
  }

  res.setHeader("Allow", "PATCH, DELETE");
  return res.status(405).json({ error: "Method not allowed" });
});
