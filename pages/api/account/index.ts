import { getAuth } from "firebase-admin/auth";
import type { NextApiRequest, NextApiResponse } from "next";
import auth0 from "../../../lib/auth0";
import admin from "../../../firebase/admin";
import { deleteUserData } from "../../../helpers/userData";
import { deleteAuth0User, isAuth0ManagementConfigured } from "../../../lib/auth0Management";

/**
 * Erases the account: every Firestore document the person owns, the Firebase
 * Auth user minted for them by /api/firebase, and — when the Management API
 * is configured — their Auth0 identity. The client logs out right after.
 */
export default auth0.withApiAuthRequired(async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await auth0.getSession(req, res);
  if (!session?.user?.sub) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const userId = session.user.sub;

  if (req.method !== "DELETE") {
    res.setHeader("Allow", "DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const deleted = await deleteUserData(admin.firestore(), userId);

    // A person who never finished the custom-token sign-in has no Firebase
    // Auth record; that is not a failure.
    try {
      await getAuth().deleteUser(userId);
    } catch (err) {
      if ((err as { code?: string }).code !== "auth/user-not-found") throw err;
    }

    let identityDeleted = false;
    if (isAuth0ManagementConfigured()) {
      await deleteAuth0User(userId);
      identityDeleted = true;
    }

    return res.status(200).json({ deleted, identityDeleted });
  } catch (err) {
    console.error("account deletion failed:", err);
    return res.status(500).json({ error: "Failed to delete account" });
  }
});
