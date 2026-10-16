import { useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/router";
import { FILTER_QUERY_KEYS, filtersFromQuery, filtersToQuery } from "../helpers/transactionFilters";
import type { TransactionFilters } from "../helpers/transactionFilters";

/**
 * The Activity filters mirrored in the URL (`?q=…&category=…&method=…&sort=…`),
 * so they survive a month change, a reload or a shared link. `initial` is read
 * when the router knows the query and again whenever `rereadOn` changes (the
 * view: the table remounts and should pick up the latest URL); a live value
 * would reset the table on every keystroke. Writes are shallow and keep the rest of the query (the
 * month) and the hash (the view).
 */
export function useFilterQuery(rereadOn?: unknown) {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  const initial = useMemo(
    () => (router.isReady ? filtersFromQuery(router.query) : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router.isReady, rereadOn]
  );

  const write = useCallback((filters: TransactionFilters) => {
    const r = routerRef.current;
    // Before the router is ready the query is empty: writing would wipe it.
    if (!r.isReady) return;
    const query = { ...r.query };
    for (const key of FILTER_QUERY_KEYS) delete query[key];
    Object.assign(query, filtersToQuery(filters));
    const same =
      FILTER_QUERY_KEYS.every((key) => r.query[key] === query[key]) &&
      Object.keys(query).length === Object.keys(r.query).length;
    if (same) return;
    const hash = globalThis.location?.hash.slice(1) || undefined;
    void r.replace({ pathname: r.pathname, query, hash }, undefined, {
      shallow: true,
      scroll: false,
    });
  }, []);

  return { initial, write };
}
