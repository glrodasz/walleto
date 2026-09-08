import type { NextApiRequest, NextApiResponse } from "next";
import auth0 from "../../../lib/auth0";
import admin from "../../../firebase/admin";
import { TransactionUpdateSchema } from "../../../schemas";

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
  const ref = db.collection("transactions").doc(id);
  const snap = await ref.get();

  if (!snap.exists) {
    return res.status(404).json({ error: "Not found" });
  }
  const existing = snap.data()!;
  if (existing.userId !== userId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (req.method === "PATCH") {
    const parsed = TransactionUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const {
      status,
      categoryId,
      name,
      amount,
      currency,
      occurredAt,
      chargedAmount,
      chargedCurrency,
      paymentMethodId,
      hiddenFromDashboard,
    } = parsed.data;

    // The charged pair must still differ from the doc's own currency —
    // whichever of the two this patch leaves in place.
    const nextCurrency = currency ?? existing.currency;
    const nextCharged = chargedCurrency === undefined ? existing.chargedCurrency : chargedCurrency;
    if (nextCharged && nextCharged === nextCurrency) {
      return res.status(400).json({ error: "chargedCurrency must differ from currency" });
    }

    if (categoryId) {
      const catSnap = await db.collection("categories").doc(categoryId).get();
      if (!catSnap.exists) {
        return res.status(400).json({ error: "Category not found" });
      }
      const cat = catSnap.data()!;
      if (cat.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      if (cat.domain !== existing.domain) {
        return res.status(400).json({ error: "Category domain mismatch" });
      }
    }

    if (paymentMethodId) {
      const pmSnap = await db.collection("paymentMethods").doc(paymentMethodId).get();
      if (!pmSnap.exists) {
        return res.status(400).json({ error: "Payment method not found" });
      }
      if (pmSnap.data()?.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }
    }

    const del = admin.firestore.FieldValue.delete();
    await ref.update({
      ...(status ? { status } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(name !== undefined ? { name } : {}),
      ...(amount !== undefined ? { amount } : {}),
      ...(currency ? { currency } : {}),
      ...(occurredAt
        ? { occurredAt: admin.firestore.Timestamp.fromDate(new Date(occurredAt)) }
        : {}),
      ...(chargedAmount !== undefined ? { chargedAmount: chargedAmount ?? del } : {}),
      ...(chargedCurrency !== undefined ? { chargedCurrency: chargedCurrency ?? del } : {}),
      ...(paymentMethodId !== undefined ? { paymentMethodId: paymentMethodId ?? del } : {}),
      ...(hiddenFromDashboard !== undefined ? { hiddenFromDashboard } : {}),
    });

    return res.status(200).json({ id });
  }

  if (req.method === "DELETE") {
    // SKIPPED is the soft delete: reads only surface PAID/PENDING, and the
    // deterministic materializer id keeps a skipped occurrence from coming back.
    await ref.update({ status: "SKIPPED" });
    return res.status(200).json({ id });
  }

  res.setHeader("Allow", "PATCH, DELETE");
  return res.status(405).json({ error: "Method not allowed" });
});
