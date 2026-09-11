import { useEffect, useState } from "react";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "../firebase/client";

let tokenPromise: Promise<void> | null = null;

// Signs the Firebase client in once per browser session using a custom token
// minted by /api/firebase. Multiple hook instances share the same promise so
// only one network request is made.
export function useFirebaseAuth() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (auth.currentUser) {
      setReady(true);
      return;
    }

    if (!tokenPromise) {
      tokenPromise = fetch("/api/firebase")
        .then((r) => {
          if (!r.ok) throw new Error(`Firebase token fetch failed (${r.status})`);
          return r.json() as Promise<{ firebaseToken: string }>;
        })
        .then(({ firebaseToken }) => signInWithCustomToken(auth, firebaseToken))
        .then(() => undefined);
    }

    tokenPromise
      .then(() => setReady(true))
      .catch((err: unknown) => {
        tokenPromise = null;
        setError(err instanceof Error ? err : new Error(String(err)));
      });
  }, []);

  return { ready, error };
}
