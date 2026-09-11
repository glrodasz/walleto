import type { NextApiRequest, NextApiResponse } from "next";
import auth0 from "../../../lib/auth0";
import admin from "../../../firebase/admin";
import { RecurrentTransactionInputSchema } from "../../../schemas";
import { nextOccurrenceFrom } from "../../../helpers/recurrence";

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
      .collection("recurrentTransactions")
      .where("userId", "==", userId)
      .where("active", "==", true);

    if (typeof domain === "string") {
      query = query.where("domain", "==", domain);
    }

    const snap = await query.get();
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return res.status(200).json(items);
  }

  if (req.method === "POST") {
    const parsed = RecurrentTransactionInputSchema.safeParse(req.body);
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
      tags,
      note,
      inheritTags,
      inheritNote,
      spreadMonthly,
      frequency,
      secondDayOfMonth,
      type,
      paymentMethodId,
      startDate,
      active,
    } = parsed.data;

    // The category must exist, belong to the caller, and match the domain.
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

    // Same for the payment method, when one is supplied.
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

    // Tags must be the caller's; unknown ids would never resolve to a name.
    if (tags && tags.length > 0) {
      const tagRefs = Array.from(new Set(tags)).map((t) => db.collection("tags").doc(t));
      const tagSnaps = await db.getAll(...tagRefs);
      if (tagSnaps.some((s) => !s.exists)) {
        return res.status(400).json({ error: "Tag not found" });
      }
      if (tagSnaps.some((s) => s.data()?.userId !== userId)) {
        return res.status(403).json({ error: "Forbidden" });
      }
    }

    const start = startDate ? new Date(startDate) : new Date();
    const twiceMonthly = frequency === "BIWEEKLY" ? secondDayOfMonth : undefined;
    const next = nextOccurrenceFrom(start, frequency, undefined, {
      secondDayOfMonth: twiceMonthly,
    });

    const ref = await db.collection("recurrentTransactions").add({
      userId,
      domain,
      categoryId,
      ...(accountId ? { accountId } : {}),
      name,
      amount,
      currency,
      ...(chargedAmount !== undefined ? { chargedAmount } : {}),
      ...(chargedCurrency ? { chargedCurrency } : {}),
      ...(tags?.length ? { tags: Array.from(new Set(tags)) } : {}),
      ...(note ? { note } : {}),
      ...(inheritTags ? { inheritTags } : {}),
      ...(inheritNote ? { inheritNote } : {}),
      ...(spreadMonthly ? { spreadMonthly } : {}),
      frequency,
      ...(twiceMonthly !== undefined ? { secondDayOfMonth: twiceMonthly } : {}),
      ...(type ? { type } : {}),
      ...(paymentMethodId ? { paymentMethodId } : {}),
      startDate: admin.firestore.Timestamp.fromDate(start),
      ...(next ? { nextOccurrence: admin.firestore.Timestamp.fromDate(next) } : {}),
      active: active ?? true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(201).json({ id: ref.id });
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
});
