import { createContext, createElement, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { useUser } from "@auth0/nextjs-auth0/client";
import { db } from "../firebase/client";
import { useFirebaseAuth } from "./useFirebaseAuth";
import type {
  Currency,
  DateFormat,
  DecimalSeparator,
  Decimals,
  Language,
  ThemePreference,
  WeekStart,
} from "../types";
import type { UserUpdate } from "../schemas";

export interface UserDoc {
  mainCurrency: Currency;
  displayCurrency?: Currency;
  enabledCurrencies?: Currency[];
  onboardingCompleted: boolean;
  onboardingMode?: "MAGIC" | "ASSISTED";
  theme?: ThemePreference;
  dateFormat?: DateFormat;
  weekStart?: WeekStart;
  language?: Language;
  decimalSeparator?: DecimalSeparator;
  decimals?: Decimals;
}

interface UserDocState {
  userDoc: UserDoc | null;
  error: Error | null;
}

const UserDocContext = createContext<UserDocState | null>(null);

// One onSnapshot on users/{sub}. `enabled: false` keeps the hook order stable
// for consumers that already read the provider's copy.
function useUserDocSubscription(enabled: boolean): UserDocState {
  const { user } = useUser();
  const { ready } = useFirebaseAuth();
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || !ready || !user?.sub) return;
    return onSnapshot(
      doc(db, "users", user.sub),
      (snap) => {
        if (snap.exists()) setUserDoc(snap.data() as UserDoc);
        setError(null);
      },
      (err) => {
        console.error("useUserDoc onSnapshot error:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    );
  }, [enabled, ready, user?.sub]);

  return { userDoc, error };
}

/**
 * Holds the app's single listener on the user doc (mounted in `_app`). Every
 * `useUserDoc()` below it reads this copy instead of opening its own.
 */
export function UserDocProvider({ children }: { children: ReactNode }) {
  const state = useUserDocSubscription(true);
  return createElement(UserDocContext.Provider, { value: state }, children);
}

async function update(patch: UserUpdate) {
  const res = await fetch("/api/user", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(await res.text());
}

export function useUserDoc() {
  const shared = useContext(UserDocContext);
  // Outside the provider (isolated mounts, tests) it subscribes on its own.
  const own = useUserDocSubscription(shared === null);
  const { userDoc, error } = shared ?? own;
  return { userDoc, error, update };
}
