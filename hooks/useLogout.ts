import { useCallback } from "react";
import type { MouseEvent } from "react";
import { signOut } from "firebase/auth";
import { clearIndexedDbPersistence, terminate } from "firebase/firestore";
import { auth, db } from "../firebase/client";

export const LOGOUT_HREF = "/api/auth/logout";

/**
 * Click handler for the "Log out" links. Firestore keeps a persistent copy of
 * the user's data in IndexedDB (see firebase/client.ts) and Firebase Auth keeps
 * its session there too, so both are wiped before Auth0 ends the session:
 * nothing financial is left behind on a shared device.
 */
export function useLogout() {
  return useCallback(async (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    try {
      await signOut(auth);
      await terminate(db);
      await clearIndexedDbPersistence(db);
    } catch (err) {
      // Never block logging out on local cleanup.
      console.error("Failed to clear local Firebase data:", err);
    }
    window.location.assign(LOGOUT_HREF);
  }, []);
}
