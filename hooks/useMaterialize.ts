import { useEffect } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";

const GUARD_KEY = "sublr.materialized";

/**
 * Asks the server to materialize any missing past occurrences right now. Call
 * it after creating something with history behind it (a backfilled recurring
 * item, a past one-time purchase) so the charts fill in without waiting for a
 * new session. Idempotent server-side, so calling it eagerly is safe.
 */
export async function materializeNow(): Promise<void> {
  const res = await fetch("/api/transactions/materialize", { method: "POST" });
  if (!res.ok) throw new Error(await res.text());
}

/**
 * Fire-and-forget trigger on dashboard mount. The endpoint is idempotent
 * (deterministic occurrence ids), so the sessionStorage guard only exists to
 * avoid a redundant request per navigation — not for correctness.
 * Deliberately not wired into login (/api/firebase).
 */
export function useMaterialize() {
  const { user } = useUser();

  useEffect(() => {
    if (!user?.sub) return;
    try {
      if (sessionStorage.getItem(GUARD_KEY)) return;
      sessionStorage.setItem(GUARD_KEY, "1");
    } catch {
      // Storage unavailable — fall through and rely on idempotency.
    }

    materializeNow().catch((err) => {
      console.error("materialize failed:", err);
      try {
        sessionStorage.removeItem(GUARD_KEY);
      } catch {
        // ignore
      }
    });
  }, [user?.sub]);
}
