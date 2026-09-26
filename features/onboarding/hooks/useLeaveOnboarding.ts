import { useState } from "react";
import { useRouter } from "next/router";
import { useUserDoc } from "../../../hooks/useUserDoc";
import { materializeNow } from "../../../hooks/useMaterialize";

const FAILURE = "Could not save your progress. Please try again.";

/**
 * "Skip for now" / "Continue later": leave the wizard for the dashboard with
 * whatever is saved so far. `flush` (from useStepNavigation) saves the rows
 * typed on the current step first, so leaving never drops input; if it fails,
 * the user stays on the step and sees that error instead.
 *
 * Marks onboarding as completed — otherwise withOnboardingGuard would bounce
 * the user straight back to step 1. Settings › Setup reopens the wizard.
 */
export function useLeaveOnboarding(flush?: () => Promise<boolean>) {
  const router = useRouter();
  const { update } = useUserDoc();
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const leave = async () => {
    if (flush && !(await flush())) return;
    setLeaving(true);
    setError(null);
    try {
      await update({ onboardingCompleted: true });
      // A backfilled item saved on the way out has history to write, as on Finish.
      await materializeNow().catch((err) => console.error("materialize failed:", err));
      router.push("/");
    } catch (err) {
      console.error("Failed to leave onboarding:", err);
      setError(FAILURE);
      setLeaving(false);
    }
  };

  return { leave, leaving, error };
}
