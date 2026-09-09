import type { NextApiRequest, NextApiResponse } from "next";
import auth0 from "../../../lib/auth0";
import admin from "../../../firebase/admin";
import { TransactionInputSchema } from "../../../schemas";

export default auth0.withApiAuthRequired(async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await auth0.getSession(req, res);
  if (!session?.user?.sub) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const userId = session.user.sub;
  const db = admin.firestore();

  if (req.method === "POST") {
    const parsed = TransactionInputSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const {
      domain,
      categoryId,
      accountId,
      name,
      amount,
      currency,
      chargedAmount,
      chargedCurrency,
      paymentMethodId,
      occurredAt,
      status,
    } = parsed.data;

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

    if (paymentMethodId) {
      const pmSnap = await db.collection("paymentMethods").doc(paymentMethodId).get();
      if (!pmSnap.exists) {
        return res.status(400).json({ error: "Payment method not found" });
      }
      if (pmSnap.data()?.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }
    }

    // And the account, when one is supplied: the caller's, in the same domain.
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

    const ref = await db.collection("transactions").add({
      userId,
      domain,
      categoryId,
      ...(accountId ? { accountId } : {}),
      name,
      amount,
      currency,
      ...(chargedAmount !== undefined ? { chargedAmount } : {}),
      ...(chargedCurrency ? { chargedCurrency } : {}),
      ...(paymentMethodId ? { paymentMethodId } : {}),
      occurredAt: admin.firestore.Timestamp.fromDate(new Date(occurredAt)),
      status: status ?? "PAID",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(201).json({ id: ref.id });
  }

  res.setHeader("Allow", "POST");
  return res.status(405).json({ error: "Method not allowed" });
});
