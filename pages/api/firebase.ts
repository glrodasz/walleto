import { getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import type { NextApiRequest, NextApiResponse } from "next";
import auth0 from "../../lib/auth0";
import admin from "../../firebase/admin";
import { seedDefaultCategories } from "../../helpers/seedDefaultCategories";

import "../../firebase/admin";

export default auth0.withApiAuthRequired(async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!getApps().length) {
    return res.status(503).json({ error: "Firebase admin is not configured in this environment." });
  }

  try {
    const session = await auth0.getSession(req, res);
    if (!session?.user?.sub) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = session.user.sub;

    // Bootstrap new users: create user doc + seed default categories on first login
    const userRef = admin.firestore().collection("users").doc(userId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      await userRef.set({
        mainCurrency: "USD",
        onboardingCompleted: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      await seedDefaultCategories(userId);
    }

    // Auth0 owns identity, but Firestore rules authorize by Firebase UID. We mint a
    // Firebase custom token keyed to the Auth0 user id so the client can sign in to
    // Firebase and have its requests scoped to that same user.
    const customToken = await getAuth().createCustomToken(userId);
    return res.status(200).json({ firebaseToken: customToken });
  } catch (err) {
    console.error("firebase token api error:", err);
    return res.status(500).json({ error: "Failed to mint token" });
  }
});
