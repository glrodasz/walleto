import type { NextApiRequest, NextApiResponse } from "next";
import auth0 from "../../../lib/auth0";
import admin from "../../../firebase/admin";
import { InvestmentValuationInputSchema } from "../../../schemas";

export default auth0.withApiAuthRequired(async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await auth0.getSession(req, res);
  if (!session?.user?.sub) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const userId = session.user.sub;
  const db = admin.firestore();

  if (req.method === "POST") {
    const parsed = InvestmentValuationInputSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { accountId, asOf, gainPct, value, costBasis, currency, note } = parsed.data;

    // An account must exist and be the caller's; its domain is the record's.
    // Without one the valuation is the domain's "No account" bucket.
    let domain = parsed.data.domain;
    if (accountId) {
      const accSnap = await db.collection("accounts").doc(accountId).get();
      if (!accSnap.exists) {
        return res.status(400).json({ error: "Account not found" });
      }
      const acc = accSnap.data()!;
      if (acc.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      domain = acc.domain;
    }

    const ref = await db.collection("investmentValuations").add({
      userId,
      domain,
      ...(accountId ? { accountId } : {}),
      asOf: admin.firestore.Timestamp.fromDate(new Date(asOf)),
      gainPct,
      value,
      costBasis,
      currency,
      ...(note ? { note } : {}),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(201).json({ id: ref.id });
  }

  res.setHeader("Allow", "POST");
  return res.status(405).json({ error: "Method not allowed" });
});
