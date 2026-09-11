import { useState } from "react";
import { useRouter } from "next/router";

/**
 * Save-then-navigate for a wizard step. Every way out of a step — Next, Back,
 * the header arrow, a click on the stepper — runs through `go`, so the draft
 * is never lost to navigation. `flush` is exposed for callers that need to
 * save without leaving (finishing onboarding).
 */
export function useStepNavigation(save: () => Promise<void>, failureMessage: string) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const flush = async (): Promise<boolean> => {
    setBusy(true);
    setError(null);
    try {
      await save();
      return true;
    } catch (err) {
      console.error(failureMessage, err);
      setError(failureMessage);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const go = async (href: string) => {
    if (await flush()) router.push(href);
  };

  return { busy, error, flush, go };
}
