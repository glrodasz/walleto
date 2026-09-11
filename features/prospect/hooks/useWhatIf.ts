import { useCallback, useState } from "react";

/**
 * Which recurrent items are being simulated as cancelled — client-only, in
 * memory for the life of the page. Scenario persistence is deferred; nothing
 * here ever calls a write API.
 */
export function useWhatIf() {
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setExcludedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const reset = useCallback(() => setExcludedIds(new Set()), []);

  return { excludedIds, toggle, reset };
}
