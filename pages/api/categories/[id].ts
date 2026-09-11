import type { NextApiRequest, NextApiResponse } from "next";
import auth0 from "../../../lib/auth0";
import admin from "../../../firebase/admin";
import { CategoryUpdateSchema } from "../../../schemas";

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
  const ref = db.collection("categories").doc(id);
  const snap = await ref.get();

  if (!snap.exists) {
    return res.status(404).json({ error: "Not found" });
  }

  if (snap.data()?.userId !== userId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (req.method === "PATCH") {
    const parsed = CategoryUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const update: Record<string, unknown> = { ...parsed.data };
    // null means "forget the pick": the field is removed, not stored as null
    if (parsed.data.icon === null) update.icon = admin.firestore.FieldValue.delete();
    // Renaming a default category promotes it to user-owned
    if (parsed.data.name !== undefined) {
      update.isDefault = false;
    }

    await ref.update(update);
    return res.status(200).json({ id });
  }

  if (req.method === "DELETE") {
    // Check if any active recurring items reference this category
    const dependents = await db
      .collection("recurrentTransactions")
      .where("categoryId", "==", id)
      .where("active", "==", true)
      .limit(1)
      .get();

    await ref.update({ archived: true });

    if (!dependents.empty) {
      res.setHeader("X-Has-Dependencies", "true");
    }
    return res.status(200).json({ id });
  }

  res.setHeader("Allow", "PATCH, DELETE");
  return res.status(405).json({ error: "Method not allowed" });
});
