import admin from "../../firebase/admin";
import { seedDefaultCategories } from "../../helpers/seedDefaultCategories";
import { nextOccurrenceFrom } from "../../helpers/recurrence";
import { computeFlow } from "../../helpers/aggregations";
import { buildHistory } from "./seedHistory";
import seedData from "../../data/testSeedData.json";
import defaultCategories from "../../data/defaultCategories.json";
import services from "../../data/services.json";
import type { ExchangeRates } from "../../helpers/fx";
import type { Currency, Domain, Frequency, RecurrentTransaction, Timestamp } from "../../types";

const BATCH_SIZE = 400;
/** How far back history is generated. The app's materializer covers 6 months;
 *  seeding 12 also fills the 1Y tab and leaves its window already written. */
const HISTORY_MONTHS = 12;

const userId = process.argv[2];
const noWipe = process.argv.includes("--no-wipe");
const dryRun = process.argv.includes("--dry-run");

if (!userId) {
  console.error("Usage: pnpm seed:user <userId> [--no-wipe] [--dry-run]");
  process.exit(1);
}

/** Lazy so `--dry-run` works with no service account configured at all. */
let dbInstance: admin.firestore.Firestore | null = null;
function db() {
  if (!dbInstance) dbInstance = admin.firestore();
  return dbInstance;
}

/**
 * Static demo rates, mirrored into `rates/{YYYY-MM-DD}` so the multi-currency
 * profile converts correctly even without EXCHANGE_RATES_API_KEY — that's the
 * fallback `/api/currencies` reads via latestMirroredRates(). A real key
 * overwrites this on the first successful fetch.
 */
const SEED_RATES: ExchangeRates = {
  base: "USD",
  rates: { USD: 1, EUR: 0.92, MXN: 17.1, GBP: 0.79, SEK: 10.6, CHF: 0.88, JPY: 151, COP: 4050 },
  fetchedAt: new Date().toISOString(),
};

const MAIN_CURRENCY: Currency = "USD";
const CTX = { rates: SEED_RATES, target: MAIN_CURRENCY };

function daysAgo(n: number) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

/** A Timestamp-shaped object — enough for the pure helpers, no SDK needed. */
function timestampLike(date: Date): Timestamp {
  return { seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0, toDate: () => date };
}

/**
 * Anchors an item's schedule: `monthsAgo` months back, on `dayOfMonth`, at
 * noon. Noon (not midnight) keeps the UTC date in the occurrence id equal to
 * the local calendar day for every timezone the app is likely to run in.
 */
function startDateFor(monthsAgo: number, dayOfMonth: number): Date {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1, 12, 0, 0, 0);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(dayOfMonth, lastDay));
  return date;
}

/** The recurrent items as the pure helpers want them, before any Firestore ids exist. */
function planItems(idFor: (index: number) => string): RecurrentTransaction[] {
  return seedData.recurrentTransactions.map(
    (rt, i) =>
      ({
        id: idFor(i),
        userId,
        domain: rt.domain as Domain,
        categoryId: "",
        name: rt.name,
        amount: rt.amount,
        currency: rt.currency as Currency,
        frequency: rt.frequency as Frequency,
        active: true,
        startDate: timestampLike(startDateFor(rt.startedMonthsAgo, rt.dayOfMonth)),
        ...(rt.chargedAmount != null ? { chargedAmount: rt.chargedAmount } : {}),
        ...(rt.chargedCurrency != null ? { chargedCurrency: rt.chargedCurrency as Currency } : {}),
      }) as RecurrentTransaction
  );
}

function monthlyFlow(items: RecurrentTransaction[]) {
  const byDomain = (domain: Domain) => items.filter((i) => i.domain === domain);
  return computeFlow(
    {
      INCOME: byDomain("INCOME"),
      EXPENSE: byDomain("EXPENSE"),
      INVESTMENT: byDomain("INVESTMENT"),
      SAVING: byDomain("SAVING"),
    },
    CTX
  );
}

const usd = (n: number) => `$${n.toFixed(2)}`;

// ── Validation (runs in both modes; the only check available offline) ────────

function validate(): string[] {
  const problems: string[] = [];
  const methodNames = new Set(seedData.paymentMethods.map((m) => m.name));
  const serviceNames = new Set(services.map((s) => s.name));
  const categoryNames = new Set(
    Object.entries(defaultCategories).flatMap(([domain, names]) =>
      (names as string[]).map((name) => `${domain}:${name}`)
    )
  );

  const checkRow = (row: {
    domain: string;
    categoryName: string;
    name: string;
    paymentMethodName: string | null;
  }) => {
    if (!categoryNames.has(`${row.domain}:${row.categoryName}`)) {
      problems.push(`"${row.name}": no default category "${row.categoryName}" in ${row.domain}`);
    }
    if (row.paymentMethodName && !methodNames.has(row.paymentMethodName)) {
      problems.push(`"${row.name}": unknown payment method "${row.paymentMethodName}"`);
    }
  };

  seedData.recurrentTransactions.forEach((rt) => {
    checkRow(rt);
    if (rt.serviceRef && !serviceNames.has(rt.serviceRef)) {
      problems.push(`"${rt.name}": unknown serviceRef "${rt.serviceRef}"`);
    }
    if ((rt.chargedAmount == null) !== (rt.chargedCurrency == null)) {
      problems.push(
        `"${rt.name}": chargedAmount and chargedCurrency must both be set or both null`
      );
    }
    if (rt.chargedCurrency && rt.chargedCurrency === rt.currency) {
      problems.push(`"${rt.name}": chargedCurrency must differ from currency`);
    }
  });
  seedData.oneOffTransactions.forEach(checkRow);

  return problems;
}

// ── Firestore writers ───────────────────────────────────────────────────────

async function deleteCollection(collectionName: string) {
  const query = db().collection(collectionName).where("userId", "==", userId).limit(BATCH_SIZE);
  let deleted = 0;

  while (true) {
    const snap = await query.get();
    if (snap.empty) break;

    const batch = db().batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    deleted += snap.docs.length;

    // The query has no cursor — it only makes progress because the docs it
    // matched are gone. Bail out rather than spin if that ever stops holding.
    if (snap.docs.length < BATCH_SIZE) break;
  }

  return deleted;
}

async function wipe() {
  for (const col of ["transactions", "recurrentTransactions", "paymentMethods", "categories"]) {
    const n = await deleteCollection(col);
    console.log(`  Wiped ${n} docs from ${col}`);
  }
}

async function seedUserDoc() {
  const ref = db().collection("users").doc(userId);
  const snap = await ref.get();

  await ref.set(
    {
      mainCurrency: MAIN_CURRENCY,
      displayCurrency: MAIN_CURRENCY,
      onboardingCompleted: true,
      ...(snap.exists ? {} : { createdAt: admin.firestore.FieldValue.serverTimestamp() }),
    },
    { merge: true }
  );
}

async function seedRates() {
  await db()
    .collection("rates")
    .doc(SEED_RATES.fetchedAt.slice(0, 10))
    .set(SEED_RATES, { merge: true });
}

async function seedPaymentMethods(): Promise<Map<string, string>> {
  const idByName = new Map<string, string>();
  const batch = db().batch();

  for (const pm of seedData.paymentMethods) {
    const ref = db().collection("paymentMethods").doc();
    batch.set(ref, {
      userId,
      name: pm.name,
      type: pm.type,
      currencies: pm.currencies,
      archived: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      ...(pm.defaultCurrency ? { defaultCurrency: pm.defaultCurrency } : {}),
      ...(pm.network ? { network: pm.network } : {}),
      ...(pm.last4 ? { last4: pm.last4 } : {}),
    });
    idByName.set(pm.name, ref.id);
  }

  await batch.commit();
  return idByName;
}

async function loadCategories(): Promise<Map<string, string>> {
  const snap = await db()
    .collection("categories")
    .where("userId", "==", userId)
    .where("archived", "==", false)
    .get();

  // key: "DOMAIN:name" → id
  const idByKey = new Map<string, string>();
  snap.docs.forEach((d) => {
    const data = d.data();
    idByKey.set(`${data.domain}:${data.name}`, d.id);
  });
  return idByKey;
}

async function seedSubcategories(catIdByKey: Map<string, string>): Promise<Map<string, string>> {
  const batch = db().batch();
  const subIdByKey = new Map<string, string>();

  for (const sub of seedData.subcategories) {
    const parentId = catIdByKey.get(`${sub.domain}:${sub.parentName}`);
    if (!parentId) {
      console.warn(
        `  Warning: parent "${sub.parentName}" (${sub.domain}) not found — skipping subcategory "${sub.name}"`
      );
      continue;
    }
    const ref = db().collection("categories").doc();
    batch.set(ref, {
      userId,
      domain: sub.domain,
      name: sub.name,
      parentId,
      isDefault: true,
      archived: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    subIdByKey.set(`${sub.domain}:${sub.parentName}:${sub.name}`, ref.id);
  }

  if (subIdByKey.size > 0) await batch.commit();
  return subIdByKey;
}

function resolveCategoryId(
  domain: string,
  categoryName: string,
  subcategoryName: string | null,
  catIdByKey: Map<string, string>,
  subIdByKey: Map<string, string>
): string | undefined {
  if (subcategoryName) {
    const key = `${domain}:${categoryName}:${subcategoryName}`;
    const id = subIdByKey.get(key);
    if (!id) {
      console.warn(
        `  Warning: subcategory "${subcategoryName}" under "${categoryName}" (${domain}) not found`
      );
    }
    return id;
  }
  const key = `${domain}:${categoryName}`;
  const id = catIdByKey.get(key);
  if (!id) {
    console.warn(`  Warning: category "${categoryName}" (${domain}) not found`);
  }
  return id;
}

async function loadServices(): Promise<
  Map<string, { serviceId: string; name: string; logoUrl?: string }>
> {
  const snap = await db().collection("services").get();
  const byName = new Map<string, { serviceId: string; name: string; logoUrl?: string }>();
  snap.docs.forEach((d) => {
    const data = d.data();
    byName.set(data.name as string, {
      serviceId: d.id,
      name: data.name as string,
      ...(data.logoUrl ? { logoUrl: data.logoUrl as string } : {}),
    });
  });
  return byName;
}

interface SeededItems {
  /** Written docs, ready for the history builder. */
  items: RecurrentTransaction[];
  /** Ids whose history gets jittered (groceries and friends). */
  variableIds: Set<string>;
}

async function seedRecurrentTransactions(
  catIdByKey: Map<string, string>,
  subIdByKey: Map<string, string>,
  pmIdByName: Map<string, string>,
  servicesByName: Map<string, { serviceId: string; name: string; logoUrl?: string }>
): Promise<SeededItems> {
  const batch = db().batch();
  const items: RecurrentTransaction[] = [];
  const variableIds = new Set<string>();

  for (const rt of seedData.recurrentTransactions) {
    const categoryId = resolveCategoryId(
      rt.domain,
      rt.categoryName,
      rt.subcategoryName,
      catIdByKey,
      subIdByKey
    );
    if (!categoryId) continue;

    const paymentMethodId = rt.paymentMethodName ? pmIdByName.get(rt.paymentMethodName) : undefined;
    const startDate = startDateFor(rt.startedMonthsAgo, rt.dayOfMonth);
    const next = nextOccurrenceFrom(startDate, rt.frequency as Frequency);
    const ref = db().collection("recurrentTransactions").doc();

    const item = {
      id: ref.id,
      userId,
      domain: rt.domain as Domain,
      categoryId,
      name: rt.name,
      amount: rt.amount,
      currency: rt.currency as Currency,
      frequency: rt.frequency as Frequency,
      type: rt.type,
      active: true,
      startDate: timestampLike(startDate),
      ...(rt.chargedAmount != null ? { chargedAmount: rt.chargedAmount } : {}),
      ...(rt.chargedCurrency != null ? { chargedCurrency: rt.chargedCurrency as Currency } : {}),
      ...(paymentMethodId ? { paymentMethodId } : {}),
    } as RecurrentTransaction;

    const serviceSnapshot = rt.serviceRef ? servicesByName.get(rt.serviceRef) : undefined;

    // Built explicitly rather than spreading `item`: the doc must carry
    // Firestore Timestamps and must not carry `id` (that's the doc key).
    batch.set(ref, {
      userId,
      domain: rt.domain,
      categoryId,
      name: rt.name,
      amount: rt.amount,
      currency: rt.currency,
      frequency: rt.frequency,
      type: rt.type,
      active: true,
      startDate: admin.firestore.Timestamp.fromDate(startDate),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      ...(next ? { nextOccurrence: admin.firestore.Timestamp.fromDate(next) } : {}),
      ...(rt.chargedAmount != null ? { chargedAmount: rt.chargedAmount } : {}),
      ...(rt.chargedCurrency != null ? { chargedCurrency: rt.chargedCurrency } : {}),
      ...(paymentMethodId ? { paymentMethodId } : {}),
      ...(serviceSnapshot ? { serviceSnapshot } : {}),
    });

    items.push(item);
    if (rt.variable) variableIds.add(ref.id);
  }

  await batch.commit();
  return { items, variableIds };
}

async function seedHistoryTransactions(seeded: SeededItems) {
  const to = new Date();
  const from = new Date(to.getFullYear(), to.getMonth() - HISTORY_MONTHS, 1);
  const docs = buildHistory(seeded.items, { from, to, variableIds: seeded.variableIds });

  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = db().batch();
    for (const { id, data } of docs.slice(i, i + BATCH_SIZE)) {
      batch.set(db().collection("transactions").doc(id), {
        ...data,
        occurredAt: admin.firestore.Timestamp.fromDate(data.occurredAt),
        status: "PAID",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();
  }

  return docs.length;
}

async function seedOneOffTransactions(
  catIdByKey: Map<string, string>,
  subIdByKey: Map<string, string>,
  pmIdByName: Map<string, string>
) {
  const batch = db().batch();
  let count = 0;

  for (const tx of seedData.oneOffTransactions) {
    const categoryId = resolveCategoryId(
      tx.domain,
      tx.categoryName,
      tx.subcategoryName,
      catIdByKey,
      subIdByKey
    );
    if (!categoryId) continue;

    const paymentMethodId = tx.paymentMethodName ? pmIdByName.get(tx.paymentMethodName) : undefined;

    // Random ids are correct here: these aren't occurrences of anything, so the
    // app's materializer has no deterministic id that could collide with them.
    batch.set(db().collection("transactions").doc(), {
      userId,
      domain: tx.domain,
      categoryId,
      name: tx.name,
      amount: tx.amount,
      currency: tx.currency,
      occurredAt: admin.firestore.Timestamp.fromDate(daysAgo(tx.daysAgo)),
      status: tx.status,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      ...(tx.chargedAmount != null ? { chargedAmount: tx.chargedAmount } : {}),
      ...(tx.chargedCurrency != null ? { chargedCurrency: tx.chargedCurrency } : {}),
      ...(paymentMethodId ? { paymentMethodId } : {}),
    });
    count++;
  }

  await batch.commit();
  return count;
}

// ── Entry points ────────────────────────────────────────────────────────────

function printSummary(items: RecurrentTransaction[], counts: Record<string, number>) {
  const flow = monthlyFlow(items);
  console.log("\nMonthly run-rate (converted to USD at the seeded rates):");
  console.log(`  income       ${usd(flow.income)}`);
  console.log(`  expenses     ${usd(flow.expenses)}`);
  console.log(`  savings      ${usd(flow.savings)}`);
  console.log(`  investments  ${usd(flow.investments)}`);
  console.log(`  net          ${usd(flow.net)}`);
  console.log("\nDocuments:");
  for (const [label, n] of Object.entries(counts)) {
    console.log(`  ${label.padEnd(22)} ${n}`);
  }
}

function dryRunPlan() {
  console.log(`Dry run for user: ${userId} — nothing will be written.\n`);

  const problems = validate();
  if (problems.length > 0) {
    console.error(`Found ${problems.length} problem(s) in data/testSeedData.json:`);
    problems.forEach((p) => console.error(`  ✗ ${p}`));
    process.exit(1);
  }
  console.log("Data file validates: every category, payment method and service resolves.");

  const items = planItems((i) => `dry-${i}`);
  const to = new Date();
  const from = new Date(to.getFullYear(), to.getMonth() - HISTORY_MONTHS, 1);
  const history = buildHistory(items, { from, to });

  printSummary(items, {
    paymentMethods: seedData.paymentMethods.length,
    recurrentTransactions: items.length,
    "transactions (history)": history.length,
    "transactions (one-off)": seedData.oneOffTransactions.length,
  });

  console.log(
    `\nHistory window: ${from.toISOString().slice(0, 10)} → ${to.toISOString().slice(0, 10)}`
  );
  console.log("Re-run without --dry-run to write it.");
}

async function seedAll() {
  console.log(`Seeding data for user: ${userId}`);

  const problems = validate();
  if (problems.length > 0) {
    console.error(`\nRefusing to seed — ${problems.length} problem(s) in data/testSeedData.json:`);
    problems.forEach((p) => console.error(`  ✗ ${p}`));
    process.exit(1);
  }

  if (!noWipe) {
    console.log("\nWiping existing user data...");
    await wipe();
  } else {
    console.log("\nSkipping wipe (--no-wipe)");
  }

  console.log("\nSeeding user doc and exchange rates...");
  await seedUserDoc();
  await seedRates();
  console.log(`  users/${userId} → mainCurrency ${MAIN_CURRENCY}, onboardingCompleted true`);
  console.log(
    `  rates/${SEED_RATES.fetchedAt.slice(0, 10)} → ${Object.keys(SEED_RATES.rates).length} currencies`
  );

  console.log("\nSeeding default categories...");
  await seedDefaultCategories(userId);
  const catIdByKey = await loadCategories();
  console.log(`  Loaded ${catIdByKey.size} categories`);

  const subIdByKey = await seedSubcategories(catIdByKey);
  if (subIdByKey.size > 0) console.log(`  Created ${subIdByKey.size} subcategories`);

  console.log("\nSeeding payment methods...");
  const pmIdByName = await seedPaymentMethods();
  console.log(`  Created ${pmIdByName.size} payment methods`);

  const servicesByName = await loadServices();
  console.log(`  Found ${servicesByName.size} services in the catalogue`);

  console.log("\nSeeding recurrent transactions...");
  const seeded = await seedRecurrentTransactions(
    catIdByKey,
    subIdByKey,
    pmIdByName,
    servicesByName
  );
  console.log(`  Created ${seeded.items.length} recurrent transactions`);

  console.log(`\nDeriving ${HISTORY_MONTHS} months of history from those items...`);
  const historyCount = await seedHistoryTransactions(seeded);
  console.log(`  Created ${historyCount} transactions with deterministic ids`);

  const oneOffCount = await seedOneOffTransactions(catIdByKey, subIdByKey, pmIdByName);
  console.log(`  Created ${oneOffCount} one-off transactions`);

  printSummary(seeded.items, {
    categories: catIdByKey.size + subIdByKey.size,
    paymentMethods: pmIdByName.size,
    recurrentTransactions: seeded.items.length,
    transactions: historyCount + oneOffCount,
  });

  console.log("\nDone — refresh the dashboard.");
}

const run = dryRun ? async () => dryRunPlan() : seedAll;

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
