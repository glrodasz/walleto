/**
 * Storybook stand-in for firebase/client. Nothing in Storybook reaches
 * Firestore (every data hook is mocked), but the module must exist because
 * the real one initialises the SDK at import time.
 */
import type { Firestore } from "firebase/firestore";
import type { Auth } from "firebase/auth";

export const db = {} as Firestore;
export const auth = { currentUser: null } as unknown as Auth;
