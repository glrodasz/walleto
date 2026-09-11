import type { NextApiRequest, NextApiResponse } from "next";
import auth0 from "../../../lib/auth0";
import admin from "../../../firebase/admin";
import {
  materializeOccurrences,
  occurrenceToTransaction,
} from "../../../helpers/materializeOccurrences";
import { BACKFILL_MONTHS } from "../../../helpers/scheduleAnchor";
import type { RecurrentTransaction } from "../../../types";

const BATCH_LIMIT = 450;

/**
 * Materializes every active recurrent item's past occurrences into the
 * transactions collection as PAID docs. Recurring items are backfilled at
 * most BACKFILL_MONTHS; a ONE_TIME item is always written, however old, since
 * it has exactly one occurrence and skipping it would lose the purchase.
 * Deterministic ids ({itemId}_{date}) make the whole operation idempotent:
 * existing docs — including ones the user has since edited or SKIPPED — are
 * left untouched.
 */
export default auth0.withApiAuthRequired(async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await auth0.getSession(req, res);
  if (!session?.user?.sub) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const userId = session.user.sub;

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const db = admin.firestore();
  const now = new Date();
  // Built from y/m/d rather than setMonth(): on the 29th–31st, setMonth
  // overflows into the following month and silently shortens the window.
  const windowStart = new Date(now.getFullYear(), now.getMonth() - BACKFILL_MONTHS, 1);

  const itemsSnap = await db
    .collection("recurrentTransactions")
    .where("userId", "==", userId)
    .where("active", "==", true)
    .get();

  const pending: { ref: FirebaseFirestore.DocumentReference; doc: Record<string, unknown> }[] = [];
  for (const d of itemsSnap.docs) {
    const item = { id: d.id, ...d.data() } as RecurrentTransaction;
    const from = item.frequency === "ONE_TIME" ? item.startDate.toDate() : windowStart;
    for (const occ of materializeOccurrences(item, from, now)) {
      pending.push({
        ref: db.collection("transactions").doc(occ.id),
        doc: {
          ...occurrenceToTransaction(item, occ.occurredAt),
          occurredAt: admin.firestore.Timestamp.fromDate(occ.occurredAt),
          status: "PAID",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        },
      });
    }
  }

  if (pending.length === 0) {
    return res.status(200).json({ created: 0, existing: 0 });
  }

  // Only write docs that don't exist yet — never clobber user edits.
  const existingIds = new Set<string>();
  for (let i = 0; i < pending.length; i += BATCH_LIMIT) {
    const chunk = pending.slice(i, i + BATCH_LIMIT);
    const snaps = await db.getAll(...chunk.map((p) => p.ref));
    for (const snap of snaps) {
      if (snap.exists) existingIds.add(snap.ref.id);
    }
  }

  const missing = pending.filter((p) => !existingIds.has(p.ref.id));
  for (let i = 0; i < missing.length; i += BATCH_LIMIT) {
    const batch = db.batch();
    for (const p of missing.slice(i, i + BATCH_LIMIT)) {
      batch.set(p.ref, p.doc);
    }
    await batch.commit();
  }

  return res.status(200).json({ created: missing.length, existing: existingIds.size });
});
