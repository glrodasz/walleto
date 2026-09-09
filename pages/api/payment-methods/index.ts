import type { NextApiRequest, NextApiResponse } from "next";
import auth0 from "../../../lib/auth0";
import admin from "../../../firebase/admin";
import { PaymentMethodInputSchema } from "../../../schemas";
import { PAYMENT_METHOD_TYPE_LABELS } from "../../../constants";
import type { Currency } from "../../../types";

import "../../../firebase/admin";

export default auth0.withApiAuthRequired(async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await auth0.getSession(req, res);
  if (!session?.user?.sub) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const userId = session.user.sub;
  const db = admin.firestore();

  if (req.method === "GET") {
    const snap = await db
      .collection("paymentMethods")
      .where("userId", "==", userId)
      .where("archived", "==", false)
      .get();

    const methods = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return res.status(200).json(methods);
  }

  if (req.method === "POST") {
    const parsed = PaymentMethodInputSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { name, type, currencies, defaultCurrency, last4, network } = parsed.data;

    // Onboarding doesn't ask for currencies per method — fall back to the
    // user's main currency so the field is never empty.
    let resolved: Currency[] | undefined = currencies;
    if (!resolved?.length) {
      const userSnap = await db.collection("users").doc(userId).get();
      resolved = [(userSnap.data()?.mainCurrency as Currency) ?? "USD"];
    }

    if (defaultCurrency && !resolved.includes(defaultCurrency)) {
      return res.status(400).json({ error: "defaultCurrency must be one of currencies" });
    }

    // A duplicate is the same type, the same network or provider *and* the
    // same alias, case-insensitively: two "Salary" bank transfers at SEB and
    // Nordea are two methods, and so are two SEB transfers with different
    // aliases. Firestore compares strings exactly, so the check runs in
    // memory over the (few) methods of that type.
    const sameType = await db
      .collection("paymentMethods")
      .where("userId", "==", userId)
      .where("type", "==", type)
      .where("archived", "==", false)
      .get();
    const fold = (v: unknown) =>
      String(v ?? "")
        .trim()
        .toLowerCase();
    const clash = (sameType.docs ?? []).some(
      (d) => fold(d.data()?.name) === fold(name) && fold(d.data()?.network) === fold(network)
    );
    if (clash) {
      return res.status(409).json({
        error: `You already have a ${PAYMENT_METHOD_TYPE_LABELS[type]} called "${name}"${
          network ? ` at ${network}` : ""
        }`,
      });
    }

    const ref = await db.collection("paymentMethods").add({
      userId,
      name,
      type,
      currencies: resolved,
      ...(defaultCurrency ? { defaultCurrency } : {}),
      ...(last4 ? { last4 } : {}),
      ...(network ? { network } : {}),
      archived: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(201).json({ id: ref.id });
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
});
