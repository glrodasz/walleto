import type { NextApiRequest, NextApiResponse } from "next";
import auth0 from "../../../../lib/auth0";
import admin from "../../../../firebase/admin";
import { nextOccurrenceFrom } from "../../../../helpers/recurrence";
import { occurrenceId, occurrenceToTransaction } from "../../../../helpers/materializeOccurrences";
import type { RecurrentTransaction } from "../../../../types";

/**
 * Marks the item's next due occurrence as PAID (the "Next to expire" kebab
 * action) and advances its schedule. Writes the same deterministic
 * {itemId}_{date} id the materializer would have produced, so a later
 * materialize pass never creates a duplicate for this date.
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

  // Pay the occurrence that's actually due; fall back to now if the schedule
  // was never materialized (e.g. edited right after creation).
  const occurredAt = item.nextOccurrence?.toDate() ?? new Date();
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

  const next = nextOccurrenceFrom(item.startDate.toDate(), item.frequency, occurredAt, {
    secondDayOfMonth: item.secondDayOfMonth,
  });
  await ref.update({
    nextOccurrence: next
      ? admin.firestore.Timestamp.fromDate(next)
      : admin.firestore.FieldValue.delete(),
  });

  return res.status(200).json({ transactionId: txId, paidAt: occurredAt.toISOString() });
});
