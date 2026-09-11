import type { NextApiRequest, NextApiResponse } from "next";
import auth0 from "../../../lib/auth0";
import { seedDefaultCategories } from "../../../helpers/seedDefaultCategories";

import "../../../firebase/admin";

export default auth0.withApiAuthRequired(async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await auth0.getSession(req, res);
  if (!session?.user?.sub) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "POST") {
    // Idempotent — only fills in defaults the user doesn't already have, so
    // restarting onboarding picks up newly shipped defaults without duplicating.
    const created = await seedDefaultCategories(session.user.sub);
    return res.status(200).json({ created });
  }

  res.setHeader("Allow", "POST");
  return res.status(405).json({ error: "Method not allowed" });
});
