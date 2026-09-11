import { useEffect, useState } from "react";
import type { ExchangeRates } from "../helpers/fx";

const STORAGE_KEY = "sublr.exchangeRates";
const TTL_MS = 24 * 60 * 60 * 1000;

interface Stored {
  fx: ExchangeRates;
  storedAt: number;
}

function readCache(): Stored | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Stored;
  } catch {
    return null;
  }
}

function writeCache(fx: ExchangeRates) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ fx, storedAt: Date.now() }));
  } catch {
    // Storage full or blocked — the in-memory copy still serves this session.
  }
}

/**
 * Exchange rates for client-side conversion.
 *
 * `rates: null` means no rates have EVER been available — consumers must then
 * render per-currency grouped subtotals instead of fabricating a conversion.
 * `stale: true` means the copy served is older than the TTL or the server
 * flagged it as a fallback snapshot; converted aggregates should show "≈".
 */
export function useExchangeRates() {
  const [rates, setRates] = useState<ExchangeRates | null>(() => readCache()?.fx ?? null);
  const [stale, setStale] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const cached = readCache();
    if (cached && Date.now() - cached.storedAt < TTL_MS) {
      setRates(cached.fx);
      setStale(false);
      setLoading(false);
      return;
    }

    fetch("/api/currencies")
      .then(async (res) => {
        if (!res.ok) throw new Error(`Rates fetch failed (${res.status})`);
        return (await res.json()) as ExchangeRates & { stale?: boolean };
      })
      .then((payload) => {
        if (cancelled) return;
        const fx: ExchangeRates = {
          base: payload.base,
          rates: payload.rates,
          fetchedAt: payload.fetchedAt,
        };
        writeCache(fx);
        setRates(fx);
        setStale(Boolean(payload.stale));
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        console.error("useExchangeRates fetch error:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        // Serve the expired cache flagged stale rather than nothing at all.
        if (cached) {
          setRates(cached.fx);
          setStale(true);
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { rates, stale, loading, error };
}
