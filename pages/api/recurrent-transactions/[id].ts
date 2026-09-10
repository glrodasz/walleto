import type { NextApiRequest, NextApiResponse } from "next";
import auth0 from "../../../lib/auth0";
import admin from "../../../firebase/admin";
import { RecurrentTransactionUpdateSchema } from "../../../schemas";
import { nextOccurrenceFrom } from "../../../helpers/recurrence";

import "../../../firebase/admin";

const BATCH_LIMIT = 450;

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
      tags,
      note,
      inheritTags,
      inheritNote,
      applyToExisting,
      frequency,
      secondDayOfMonth,
      categoryId,
      accountId,
      paymentMethodId,
      type,
      startDate,
      active,
      hiddenFromDashboard,
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
      if (acc.domain !== existing.domain) {
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
      ...(tags !== undefined ? { tags: tags?.length ? Array.from(new Set(tags)) : del } : {}),
      ...(note !== undefined ? { note: note || del } : {}),
      ...(inheritTags !== undefined ? { inheritTags } : {}),
      ...(inheritNote !== undefined ? { inheritNote } : {}),
      ...(frequency !== undefined ? { frequency } : {}),
      ...(secondDayOfMonth !== undefined ? { secondDayOfMonth: secondDayOfMonth ?? del } : {}),
      ...(categoryId !== undefined ? { categoryId } : {}),
      ...(accountId !== undefined ? { accountId: accountId ?? del } : {}),
      ...(paymentMethodId !== undefined ? { paymentMethodId: paymentMethodId ?? del } : {}),
      ...(type !== undefined ? { type: type ?? del } : {}),
      ...(active !== undefined ? { active } : {}),
      ...(hiddenFromDashboard !== undefined ? { hiddenFromDashboard } : {}),
      ...occurrencePatch,
    });

    // "Also update the existing payments": rewrite tags / note on every row
    // this item wrote. Two equality filters, no index; SKIPPED rows are
    // rewritten too — harmless, and it avoids a third filter.
    let updated = 0;
    if (applyToExisting && (tags !== undefined || note !== undefined)) {
      const rowPatch = {
        ...(tags !== undefined ? { tags: tags?.length ? Array.from(new Set(tags)) : del } : {}),
        ...(note !== undefined ? { note: note || del } : {}),
      };
      const rows = await db
        .collection("transactions")
        .where("userId", "==", userId)
        .where("recurrentTransactionId", "==", id)
        .get();
      for (let i = 0; i < rows.docs.length; i += BATCH_LIMIT) {
        const batch = db.batch();
        for (const d of rows.docs.slice(i, i + BATCH_LIMIT)) batch.update(d.ref, rowPatch);
        await batch.commit();
      }
      updated = rows.docs.length;
    }

    return res.status(200).json({ id, updated });
  }

  if (req.method === "DELETE") {
    // Deactivate rather than delete so historical transactions keep resolving.
    await ref.update({ active: false });
    return res.status(200).json({ id });
  }

  res.setHeader("Allow", "PATCH, DELETE");
  return res.status(405).json({ error: "Method not allowed" });
});
