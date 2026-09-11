import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import auth0 from "../../lib/auth0";
import admin from "../../firebase/admin";
import { request } from "../../utils/request";
import { CURRENCIES } from "../../constants";
import type { ExchangeRates } from "../../helpers/fx";

import "../../firebase/admin";

const SYMBOLS = CURRENCIES.filter((c) => c !== "USD");

const UpstreamSchema = z.object({
  rates: z.record(z.string(), z.number().positive()),
});

const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
let cache: ExchangeRates | null = null;

/** Test hook — module-level cache would otherwise leak between test cases. */
export function _resetRatesCacheForTests() {
  cache = null;
}

function toDateKey(iso: string): string {
  return iso.slice(0, 10);
}

async function mirrorToFirestore(fx: ExchangeRates) {
  try {
    await admin
      .firestore()
      .collection("rates")
      .doc(toDateKey(fx.fetchedAt))
      .set(fx, { merge: true });
  } catch (err) {
    // The mirror is a fallback store, never worth failing the request over.
    console.warn("[currencies] failed to mirror rates:", err);
  }
}

async function latestMirroredRates(): Promise<ExchangeRates | null> {
  try {
    const snap = await admin
      .firestore()
      .collection("rates")
      .orderBy(admin.firestore.FieldPath.documentId(), "desc")
      .limit(1)
      .get();
    if (snap.empty) return null;
    return snap.docs[0].data() as ExchangeRates;
  } catch (err) {
    console.warn("[currencies] failed to read mirrored rates:", err);
    return null;
  }
}

async function fetchUpstream(apiKey: string): Promise<ExchangeRates> {
  const url = `https://api.apilayer.com/exchangerates_data/latest?symbols=${SYMBOLS.join(",")}&base=USD`;
  const raw = await request<unknown>(url, { headers: { apikey: apiKey } });
  const parsed = UpstreamSchema.parse(raw);

  const rates = { USD: 1 } as ExchangeRates["rates"];
  for (const symbol of SYMBOLS) {
    const rate = parsed.rates[symbol];
    if (typeof rate !== "number") {
      throw new Error(`Upstream response missing rate for ${symbol}`);
    }
    rates[symbol] = rate;
  }

  return { base: "USD", rates, fetchedAt: new Date().toISOString() };
}

export default auth0.withApiAuthRequired(async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await auth0.getSession(req, res);
  if (!session?.user?.sub) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (cache && Date.now() - Date.parse(cache.fetchedAt) < CACHE_TTL_MS) {
    res.setHeader("Cache-Control", "private, max-age=3600");
    return res.status(200).json({ ...cache, stale: false });
  }

  const apiKey = process.env.EXCHANGE_RATES_API_KEY;
  if (apiKey) {
    try {
      const fresh = await fetchUpstream(apiKey);
      cache = fresh;
      await mirrorToFirestore(fresh);
      res.setHeader("Cache-Control", "private, max-age=3600");
      return res.status(200).json({ ...fresh, stale: false });
    } catch (err) {
      console.error("[currencies] upstream fetch failed:", err);
    }
  } else {
    console.error("[currencies] EXCHANGE_RATES_API_KEY is not set");
  }

  // Upstream unavailable — serve yesterday's snapshot rather than an error, so
  // aggregates stay convertible; the client marks them as stale.
  const mirrored = cache ?? (await latestMirroredRates());
  if (mirrored) {
    return res.status(200).json({ ...mirrored, stale: true });
  }

  return res.status(503).json({ error: "Exchange rates unavailable" });
});
