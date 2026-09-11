import admin from "../firebase/admin";
import defaults from "../data/defaultCategories.json";
import { defaultIconFor } from "./categoryIcons";
import type { Domain } from "../types";

/**
 * Creates any default categories the user is missing.
 *
 * Idempotent: existing non-archived names are skipped, so this can run on first
 * login and again whenever the user restarts onboarding without duplicating
 * anything. Comparison is case-insensitive per domain.
 *
 * Returns the number of categories actually created.
 */
export async function seedDefaultCategories(userId: string): Promise<number> {
  const db = admin.firestore();

  const existing = await db
    .collection("categories")
    .where("userId", "==", userId)
    .where("archived", "==", false)
    .get();

  const taken = new Set(
    existing.docs.map((d) => {
      const data = d.data();
      return `${data.domain}:${String(data.name).toLowerCase()}`;
    })
  );

  const batch = db.batch();
  let created = 0;

  for (const [domain, names] of Object.entries(defaults)) {
    for (const name of names as string[]) {
      if (taken.has(`${domain}:${name.toLowerCase()}`)) continue;

      const ref = db.collection("categories").doc();
      batch.set(ref, {
        userId,
        domain: domain as Domain,
        name,
        icon: defaultIconFor(name, domain as Domain),
        isDefault: true,
        archived: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      created++;
    }
  }

  if (created > 0) await batch.commit();
  return created;
}
