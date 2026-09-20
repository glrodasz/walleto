import type { NextApiRequest, NextApiResponse } from "next";
import auth0 from "../../../lib/auth0";
import admin from "../../../firebase/admin";
import { collectUserData } from "../../../helpers/userData";

/**
 * Everything the app holds about the signed-in person, as one JSON file —
 * the right of access and portability (docs/compliance.md), served straight
 * from Firestore so the export is always current.
 */
export default auth0.withApiAuthRequired(async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await auth0.getSession(req, res);
  if (!session?.user?.sub) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const userId = session.user.sub;

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const data = await collectUserData(admin.firestore(), userId);
  const day = data.exportedAt.slice(0, 10);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="waletto-export-${day}.json"`);
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).send(JSON.stringify(data, null, 2));
});
