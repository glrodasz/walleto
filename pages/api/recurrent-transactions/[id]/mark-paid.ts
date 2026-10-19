import type { NextApiRequest, NextApiResponse } from "next";
import auth0 from "../../../../lib/auth0";
import admin from "../../../../firebase/admin";
import { nextOccurrenceFrom } from "../../../../helpers/recurrence";
import {
  materializeOccurrences,
  occurrenceId,
  occurrenceToTransaction,
} from "../../../../helpers/materializeOccurrences";
import { RecurrentTransactionMarkPaidSchema } from "../../../../schemas";
import type { RecurrentTransaction } from "../../../../types";

/** How far a client's occurrence instant may sit from the server's (time zones, DST). */
const MATCH_WINDOW_MS = 12 * 60 * 60 * 1000;

/**
 * Marks one occurrence of the item as PAID: the one named in the body (the
 * Plan row the owner tapped, which can be an overdue one behind the
 * schedule), or else the item's nextOccurrence (the dashboard's "Coming up"
 * list). Writes the same deterministic {itemId}_{date} id the materializer
 * would have produced, so a later materialize pass never creates a duplicate
 * for this date. The schedule only advances when the paid date is the next
 * one or later: paying a past occurrence must not skip a future one.
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

  const parsed = RecurrentTransactionMarkPaidSchema.safeParse(req.body || undefined);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const db = admin.firestore();
  const ref = db.collection("recurrentTransactions").doc(id);
  const snap = await ref.get();

  if (!snap.exists) {
    return res.status(404).json({ error: "Not found" });
  }
  const item = { id: snap.id, ...snap.data() } as RecurrentTransaction;
  if (item.userId !== userId) {
    return res.status(403).json({ error: "Forbidden" });
  }
  if (!item.active) {
    return res.status(400).json({ error: "Item is not active" });
  }

  const nextDue = item.nextOccurrence?.toDate();
  let occurredAt: Date;
  if (parsed.data.occurredAt) {
    const asked = new Date(parsed.data.occurredAt);
    // Only a real occurrence of the schedule: any other day would write a row
    // the checklist and the materializer never line up with. The browser and
    // this server can sit in different time zones, so across a DST change the
    // same occurrence lands an hour apart: take the schedule's own instant
    // nearest to the one asked for, as the materializer would write it.
    const [occ] = materializeOccurrences(
      { ...item, id },
      new Date(asked.getTime() - MATCH_WINDOW_MS),
      new Date(asked.getTime() + MATCH_WINDOW_MS)
    ).sort(
      (a, b) =>
        Math.abs(a.occurredAt.getTime() - asked.getTime()) -
        Math.abs(b.occurredAt.getTime() - asked.getTime())
    );
    if (!occ) {
      return res.status(400).json({ error: "Not an occurrence of this item" });
    }
    occurredAt = occ.occurredAt;
  } else {
    // Pay the occurrence that's actually due; fall back to now if the schedule
    // was never materialized (e.g. edited right after creation).
    occurredAt = nextDue ?? new Date();
  }
  const txId = occurrenceId(id, occurredAt);
  const txRef = db.collection("transactions").doc(txId);

  await txRef.set(
    {
      ...occurrenceToTransaction(item, occurredAt),
      occurredAt: admin.firestore.Timestamp.fromDate(occurredAt),
      status: "PAID",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  if (!nextDue || occurredAt >= nextDue) {
    const next = nextOccurrenceFrom(item.startDate.toDate(), item.frequency, occurredAt, {
      secondDayOfMonth: item.secondDayOfMonth,
    });
    await ref.update({
      nextOccurrence: next
        ? admin.firestore.Timestamp.fromDate(next)
        : admin.firestore.FieldValue.delete(),
    });
  }

  return res.status(200).json({ transactionId: txId, paidAt: occurredAt.toISOString() });
});
