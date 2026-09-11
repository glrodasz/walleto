import { useCallback, useEffect, useState } from "react";

/**
 * A per-browser preference (a chart mode, a dismissed tip) kept in
 * localStorage. Reads after mount so server and client render the same
 * first frame; writes fail quietly in private mode or with storage off.
 */
export function useLocalPreference<T>(
  key: string,
  initial: T,
  parse: (raw: string) => T = (raw) => JSON.parse(raw) as T
): [T, (next: T) => void] {
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) setValue(parse(raw));
    } catch {
      // Storage off: the default stands.
    }
    // `parse` is a plain function of the raw string; the key decides the read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const set = useCallback(
    (next: T) => {
      setValue(next);
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // The choice just doesn't stick.
      }
    },
    [key]
  );

  return [value, set];
}
