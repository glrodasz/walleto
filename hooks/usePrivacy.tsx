import { createContext, useCallback, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import { useLocalPreference } from "./useLocalPreference";

export const PRIVACY_STORAGE_KEY = "waletto:privacy";

interface PrivacyContextValue {
  /** True while every amount reads as `****`. */
  hidden: boolean;
  toggle: () => void;
}

const PrivacyContext = createContext<PrivacyContextValue>({ hidden: false, toggle: () => {} });

/**
 * Privacy mode — whether money is written out or masked.
 *
 * It answers "someone can see my screen", which is about the device in front
 * of you and not about the account, so it lives in localStorage and never
 * reaches the user doc: a laptop in a café can be private while the phone at
 * home is not. Only the labels change; every total, bar and share is still
 * computed from the real numbers, so the shapes keep their proportions.
 */
export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useLocalPreference<boolean>(PRIVACY_STORAGE_KEY, false);
  const toggle = useCallback(() => setHidden(!hidden), [hidden, setHidden]);
  const value = useMemo(() => ({ hidden, toggle }), [hidden, toggle]);
  return <PrivacyContext.Provider value={value}>{children}</PrivacyContext.Provider>;
}

export function usePrivacy(): PrivacyContextValue {
  return useContext(PrivacyContext);
}
