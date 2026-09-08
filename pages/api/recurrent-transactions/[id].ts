import type { NextApiRequest, NextApiResponse } from "next";
import auth0 from "../../../lib/auth0";
import admin from "../../../firebase/admin";
import { RecurrentTransactionUpdateSchema } from "../../../schemas";
import { nextOccurrenceFrom } from "../../../helpers/recurrence";

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
  const ref = db.collection("recurrentTransactions").doc(id);
  const snap = await ref.get();

  if (!snap.exists) {
    return res.status(404).json({ error: "Not found" });
  }

  const existing = snap.data()!;
  if (existing.userId !== userId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (req.method === "PATCH") {
    const parsed = RecurrentTransactionUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const {
      name,
      amount,
      currency,
      chargedAmount,
      chargedCurrency,
      frequency,
      secondDayOfMonth,
      categoryId,
      paymentMethodId,
      type,
      startDate,
      active,
    } = parsed.data;

    // The charged pair must differ from the item's (possibly updated) currency.
    const nextCurrency = currency ?? existing.currency;
    const nextCharged = chargedCurrency !== undefined ? chargedCurrency : existing.chargedCurrency;
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
      // The item's domain is immutable; a new category must live in it.
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

    // A schedule change moves the next occurrence.
    let occurrencePatch: Record<string, unknown> = {};
    if (frequency !== undefined || startDate !== undefined || secondDayOfMonth !== undefined) {
      const nextStart = startDate ? new Date(startDate) : existing.startDate.toDate();
      const next = nextOccurrenceFrom(nextStart, frequency ?? existing.frequency, undefined, {
        secondDayOfMonth:
          secondDayOfMonth === undefined
            ? existing.secondDayOfMonth
            : (secondDayOfMonth ?? undefined),
      });
      occurrencePatch = {
        ...(startDate ? { startDate: admin.firestore.Timestamp.fromDate(nextStart) } : {}),
        nextOccurrence: next
          ? admin.firestore.Timestamp.fromDate(next)
          : admin.firestore.FieldValue.delete(),
      };
    }

    const del = admin.firestore.FieldValue.delete();
    await ref.update({
      ...(name !== undefined ? { name } : {}),
      ...(amount !== undefined ? { amount } : {}),
      ...(currency !== undefined ? { currency } : {}),
      ...(chargedAmount !== undefined ? { chargedAmount: chargedAmount ?? del } : {}),
      ...(chargedCurrency !== undefined ? { chargedCurrency: chargedCurrency ?? del } : {}),
      ...(frequency !== undefined ? { frequency } : {}),
      ...(secondDayOfMonth !== undefined ? { secondDayOfMonth: secondDayOfMonth ?? del } : {}),
      ...(categoryId !== undefined ? { categoryId } : {}),
      ...(paymentMethodId !== undefined ? { paymentMethodId: paymentMethodId ?? del } : {}),
      ...(type !== undefined ? { type: type ?? del } : {}),
      ...(active !== undefined ? { active } : {}),
      ...occurrencePatch,
    });

    return res.status(200).json({ id });
  }

  if (req.method === "DELETE") {
    // Deactivate rather than delete so historical transactions keep resolving.
    await ref.update({ active: false });
    return res.status(200).json({ id });
  }

  res.setHeader("Allow", "PATCH, DELETE");
  return res.status(405).json({ error: "Method not allowed" });
});
