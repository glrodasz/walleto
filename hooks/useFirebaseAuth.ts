import { useEffect, useState } from "react";
import { signInWithCustomToken, signOut } from "firebase/auth";
import { useUser } from "@auth0/nextjs-auth0/client";
import { auth } from "../firebase/client";

let pending: { sub: string; promise: Promise<void> } | null = null;

async function signIn(sub: string) {
  // Firebase restores the last session from IndexedDB asynchronously, so
  // `auth.currentUser` is always null on the first render after a reload.
  // Waiting for that restore lets a returning user skip /api/firebase entirely.
  await auth.authStateReady();
  if (auth.currentUser?.uid === sub) return;
  // A different Auth0 user on this browser: drop the stale Firebase session.
  if (auth.currentUser) await signOut(auth);

  const res = await fetch("/api/firebase");
  if (!res.ok) throw new Error(`Firebase token fetch failed (${res.status})`);
  const { firebaseToken } = (await res.json()) as { firebaseToken: string };
  await signInWithCustomToken(auth, firebaseToken);
}

// Signs the Firebase client in as the current Auth0 user. Multiple hook
// instances share the same promise so only one sign-in happens per user.
export function useFirebaseAuth() {
  const { user } = useUser();
  const sub = user?.sub;
  const [ready, setReady] = useState(() => Boolean(sub && auth.currentUser?.uid === sub));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!sub) return;
    if (auth.currentUser?.uid === sub) {
      setReady(true);
      return;
    }

    if (!pending || pending.sub !== sub) {
      const entry = { sub, promise: signIn(sub) };
      pending = entry;
      // Only the in-flight sign-in is shared; once it lands, `currentUser`
      // answers for every later mount.
      entry.promise.then(
        () => {
          if (pending === entry) pending = null;
        },
        () => {
          if (pending === entry) pending = null;
        }
      );
    }
    const current = pending;

    let cancelled = false;
    current.promise
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)));
      });
    return () => {
      cancelled = true;
    };
  }, [sub]);

  return { ready, error };
}
