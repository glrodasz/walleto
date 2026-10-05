import { useCallback, useEffect, useMemo, useState } from "react";

type Flags = Record<string, boolean>;

/**
 * The boolean fields of a PATCH body — the only ones that mean the same thing
 * in the patch and in the stored doc. A date travels as an ISO string and
 * `null` means "delete", so those keep waiting for the snapshot.
 */
export function pickBooleans(patch: object): Flags {
  return Object.fromEntries(
    Object.entries(patch).filter(([, v]) => typeof v === "boolean")
  ) as Flags;
}

const confirmed = (doc: object, flags: Flags) =>
  Object.entries(flags).every(([k, v]) => (doc as Record<string, unknown>)[k] === v);

const withoutKeys = (flags: Flags, keys: string[]) =>
  Object.fromEntries(Object.entries(flags).filter(([k]) => !keys.includes(k)));

/**
 * Writes go through API routes, so the client gets no latency-compensated
 * write: the page only changes when the listener pushes the server's copy
 * back, and on mobile that push can arrive late. This lays a flag the owner
 * just flipped over the snapshot docs until a snapshot agrees with it (or the
 * write fails, which puts the old value back). The snapshot stays the source
 * of truth.
 */
export function useOptimisticPatches<T extends { id?: string }>(docs: T[]) {
  const [pending, setPending] = useState<Record<string, Flags>>({});

  // Drop what the server has caught up with, and anything no longer listed.
  useEffect(() => {
    setPending((current) => {
      const ids = Object.keys(current);
      if (ids.length === 0) return current;
      const next: Record<string, Flags> = {};
      for (const id of ids) {
        const doc = docs.find((d) => d.id === id);
        if (doc && !confirmed(doc, current[id])) next[id] = current[id];
      }
      return Object.keys(next).length === ids.length ? current : next;
    });
  }, [docs]);

  const merged = useMemo(
    () =>
      Object.keys(pending).length === 0
        ? docs
        : docs.map((d) => (d.id && pending[d.id] ? ({ ...d, ...pending[d.id] } as T) : d)),
    [docs, pending]
  );

  const apply = useCallback(async (id: string, flags: Flags, write: () => Promise<void>) => {
    const keys = Object.keys(flags);
    if (keys.length > 0) setPending((p) => ({ ...p, [id]: { ...p[id], ...flags } }));
    try {
      await write();
    } catch (err) {
      if (keys.length > 0) {
        setPending((p) => {
          const rest = withoutKeys(p[id] ?? {}, keys);
          const next = { ...p };
          if (Object.keys(rest).length > 0) next[id] = rest;
          else delete next[id];
          return next;
        });
      }
      throw err;
    }
  }, []);

  return { docs: merged, apply };
}
