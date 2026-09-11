import type { NextApiRequest, NextApiResponse } from "next";
import auth0 from "../../../lib/auth0";
import admin from "../../../firebase/admin";
import { TagInputSchema } from "../../../schemas";
import { normaliseTagName, tagKey } from "../../../helpers/tags";

import "../../../firebase/admin";

export default auth0.withApiAuthRequired(async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await auth0.getSession(req, res);
  if (!session?.user?.sub) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const userId = session.user.sub;
  const db = admin.firestore();

  if (req.method === "GET") {
    const snap = await db
      .collection("tags")
      .where("userId", "==", userId)
      .where("archived", "==", false)
      .get();
    return res.status(200).json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }

  if (req.method === "POST") {
    const parsed = TagInputSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const name = normaliseTagName(parsed.data.name);
    const key = tagKey(name);
    if (!name) {
      return res.status(400).json({ error: "Give the tag a name" });
    }

    // One tag per key. A live clash is a duplicate; an archived one comes
    // back under the new spelling, so "archive, then recreate" never leaves
    // two docs with the same key.
    const sameKey = await db
      .collection("tags")
      .where("userId", "==", userId)
      .where("key", "==", key)
      .get();
    const live = sameKey.docs.find((d) => d.data()?.archived === false);
    if (live) {
      return res.status(409).json({ error: `You already have a tag called "${live.data().name}"` });
    }
    const archived = sameKey.docs[0];
    if (archived) {
      await archived.ref.update({ name, archived: false });
      return res.status(201).json({ id: archived.id });
    }

    const ref = await db.collection("tags").add({
      userId,
      name,
      key,
      archived: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return res.status(201).json({ id: ref.id });
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
});
