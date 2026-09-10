import type { NextApiRequest, NextApiResponse } from "next";
import auth0 from "../../../lib/auth0";
import admin from "../../../firebase/admin";
import { TagUpdateSchema } from "../../../schemas";
import { normaliseTagName, tagKey } from "../../../helpers/tags";

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
  const ref = db.collection("tags").doc(id);
  const snap = await ref.get();

  if (!snap.exists) {
    return res.status(404).json({ error: "Not found" });
  }
  if (snap.data()?.userId !== userId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (req.method === "PATCH") {
    const parsed = TagUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { archived } = parsed.data;
    const patch: Record<string, unknown> = {};

    if (parsed.data.name !== undefined) {
      const name = normaliseTagName(parsed.data.name);
      const key = tagKey(name);
      if (!name) {
        return res.status(400).json({ error: "Give the tag a name" });
      }
      // Renaming to another live tag's spelling would merge two tags by accident.
      const sameKey = await db
        .collection("tags")
        .where("userId", "==", userId)
        .where("key", "==", key)
        .get();
      const clash = sameKey.docs.find((d) => d.id !== id && d.data()?.archived === false);
      if (clash) {
        return res
          .status(409)
          .json({ error: `You already have a tag called "${clash.data().name}"` });
      }
      patch.name = name;
      patch.key = key;
    }
    if (archived !== undefined) patch.archived = archived;

    await ref.update(patch);
    return res.status(200).json({ id });
  }

  if (req.method === "DELETE") {
    // Soft-delete: rows keep the id and simply stop resolving it.
    await ref.update({ archived: true });
    return res.status(200).json({ id });
  }

  res.setHeader("Allow", "PATCH, DELETE");
  return res.status(405).json({ error: "Method not allowed" });
});
