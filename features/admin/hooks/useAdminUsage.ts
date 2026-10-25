import { useCallback, useEffect, useState } from "react";
import { request } from "../../../utils/request";
import type { UsageSummary } from "../types";

/** The admin usage summary, fetched once on mount and again on `reload()`. */
export function useAdminUsage() {
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setUsage(await request<UsageSummary>("/api/admin/usage"));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { usage, loading, error, reload };
}
