import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { useUser } from "@auth0/nextjs-auth0/client";
import { db } from "../firebase/client";
import { useFirebaseAuth } from "./useFirebaseAuth";
import type { Currency, DateFormat, Language, ThemePreference, WeekStart } from "../types";
import type { UserUpdate } from "../schemas";

export interface UserDoc {
  mainCurrency: Currency;
  displayCurrency?: Currency;
  onboardingCompleted: boolean;
  onboardingMode?: "MAGIC" | "ASSISTED";
  theme?: ThemePreference;
  dateFormat?: DateFormat;
  weekStart?: WeekStart;
  language?: Language;
}

export function useUserDoc() {
  const { user } = useUser();
  const { ready } = useFirebaseAuth();
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!ready || !user?.sub) return;
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
  }, [ready, user?.sub]);

  const update = async (patch: UserUpdate) => {
    const res = await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error(await res.text());
  };

  return { userDoc, error, update };
}
