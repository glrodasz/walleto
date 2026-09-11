import admin from "../../firebase/admin";
import services from "../../data/services.json";

async function seedServices() {
  const db = admin.firestore();
  const now = admin.firestore.FieldValue.serverTimestamp();

  let created = 0;
  for (const service of services) {
    const existing = await db
      .collection("services")
      .where("name", "==", service.name)
      .limit(1)
      .get();

    if (!existing.empty) {
      console.info(`Skipping "${service.name}" — already exists`);
      continue;
    }

    await db.collection("services").add({
      ...service,
      createdAt: now,
      updatedAt: now,
    });
    console.info(`Created service: ${service.name}`);
    created++;
  }

  console.log(`Done. Created ${created} service(s).`);
}

seedServices().catch((err) => {
  console.error(err);
  process.exit(1);
});
