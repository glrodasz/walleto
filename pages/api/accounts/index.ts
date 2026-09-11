import type { NextApiRequest, NextApiResponse } from "next";
import auth0 from "../../../lib/auth0";
import admin from "../../../firebase/admin";
import { AccountInputSchema } from "../../../schemas";
import { ACCOUNT_NOUN } from "../../../helpers/accounts";

import "../../../firebase/admin";

export default auth0.withApiAuthRequired(async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await auth0.getSession(req, res);
  if (!session?.user?.sub) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const userId = session.user.sub;
  const db = admin.firestore();

  if (req.method === "GET") {
    const { domain } = req.query;
    let query = db
      .collection("accounts")
      .where("userId", "==", userId)
      .where("archived", "==", false);
    if (typeof domain === "string") {
      query = query.where("domain", "==", domain);
    }
    const snap = await query.get();
    return res.status(200).json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }

  if (req.method === "POST") {
    const parsed = AccountInputSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { domain, name, provider, currency, interestRate } = parsed.data;

    // A duplicate is the same domain with the same name, case-insensitively.
    // Firestore compares strings exactly, so the name check runs in memory
    // over the (few) accounts of that domain.
    const sameDomain = await db
      .collection("accounts")
      .where("userId", "==", userId)
      .where("domain", "==", domain)
      .where("archived", "==", false)
      .get();
    const wanted = name.trim().toLowerCase();
    const clash = (sameDomain.docs ?? []).some(
      (d) =>
        String(d.data()?.name ?? "")
          .trim()
          .toLowerCase() === wanted
    );
    if (clash) {
      return res
        .status(409)
        .json({ error: `You already have ${ACCOUNT_NOUN[domain].article} called "${name}"` });
    }

    const ref = await db.collection("accounts").add({
      userId,
      domain,
      name,
      ...(provider ? { provider } : {}),
      currency,
      ...(interestRate ? { interestRate } : {}),
      archived: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(201).json({ id: ref.id });
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
});
