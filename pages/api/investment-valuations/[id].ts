import type { NextApiRequest, NextApiResponse } from "next";
import auth0 from "../../../lib/auth0";
import admin from "../../../firebase/admin";
import { InvestmentValuationUpdateSchema } from "../../../schemas";

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
  const ref = db.collection("investmentValuations").doc(id);
  const snap = await ref.get();

  if (!snap.exists) {
    return res.status(404).json({ error: "Not found" });
  }
  if (snap.data()?.userId !== userId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (req.method === "PATCH") {
    const parsed = InvestmentValuationUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { asOf, gainPct, value, costBasis, note } = parsed.data;

    await ref.update({
      ...(asOf ? { asOf: admin.firestore.Timestamp.fromDate(new Date(asOf)) } : {}),
      ...(gainPct !== undefined ? { gainPct } : {}),
      ...(value !== undefined ? { value } : {}),
      ...(costBasis !== undefined ? { costBasis } : {}),
      ...(note !== undefined ? { note: note ?? admin.firestore.FieldValue.delete() } : {}),
    });

    return res.status(200).json({ id });
  }

  if (req.method === "DELETE") {
    // A valuation is a data point nothing else references, so — unlike
    // categories, methods and items — removing it really removes it.
    await ref.delete();
    return res.status(200).json({ id });
  }

  res.setHeader("Allow", "PATCH, DELETE");
  return res.status(405).json({ error: "Method not allowed" });
});
