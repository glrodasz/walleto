import type { NextApiRequest, NextApiResponse } from "next";
import auth0 from "../../../../lib/auth0";
import admin from "../../../../firebase/admin";
import { RecurrentTransactionConvertSchema } from "../../../../schemas";

const BATCH_LIMIT = 450;

/**
 * "This pays off a debt": moves a recurring expense — and every payment it
 * has written — into the DEBT domain, under a debt category and optionally a
 * debt. The item's domain is otherwise immutable (every PATCH check compares
 * against it), so the move is its own route. Occurrence ids never change, so
 * the materializer keeps recognising the rows it wrote.
 */
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

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const parsed = RecurrentTransactionConvertSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { domain, categoryId, accountId } = parsed.data;

  const db = admin.firestore();
  const ref = db.collection("recurrentTransactions").doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return res.status(404).json({ error: "Not found" });
  }
  const existing = snap.data()!;
  if (existing.userId !== userId) {
    return res.status(403).json({ error: "Forbidden" });
  }
  if (existing.domain !== "EXPENSE") {
    return res.status(400).json({ error: "Only an expense can become a debt repayment" });
  }

  // The category must be the caller's and live in the target domain.
  const catSnap = await db.collection("categories").doc(categoryId).get();
  if (!catSnap.exists) {
    return res.status(400).json({ error: "Category not found" });
  }
  const cat = catSnap.data()!;
  if (cat.userId !== userId) {
    return res.status(403).json({ error: "Forbidden" });
  }
  if (cat.domain !== domain) {
    return res.status(400).json({ error: "Category domain mismatch" });
  }

  // And the debt, when one is named.
  if (accountId) {
    const accSnap = await db.collection("accounts").doc(accountId).get();
    if (!accSnap.exists) {
      return res.status(400).json({ error: "Account not found" });
    }
    const acc = accSnap.data()!;
    if (acc.userId !== userId) {
      return res.status(403).json({ error: "Forbidden" });
    }
    if (acc.domain !== domain) {
      return res.status(400).json({ error: "Account domain mismatch" });
    }
  }

  const del = admin.firestore.FieldValue.delete();
  const move = { domain, categoryId, accountId: accountId ?? del };
  await ref.update({ ...move, type: "LOAN_PAYMENT" });

  // Every payment the item wrote follows it, so what was paid so far counts
  // as repaid at once. Two equality filters, no index.
  const rows = await db
    .collection("transactions")
    .where("userId", "==", userId)
    .where("recurrentTransactionId", "==", id)
    .get();
  for (let i = 0; i < rows.docs.length; i += BATCH_LIMIT) {
    const batch = db.batch();
    for (const d of rows.docs.slice(i, i + BATCH_LIMIT)) batch.update(d.ref, move);
    await batch.commit();
  }

  return res.status(200).json({ id, updated: rows.docs.length });
});
