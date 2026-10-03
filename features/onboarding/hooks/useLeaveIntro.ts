import { useRouter } from "next/router";
import { useUserDoc } from "../../../hooks/useUserDoc";
import { ONBOARDING_ENTRY } from "../helpers/routes";

/**
 * The way out of the intro, whether through its last slide or "Skip intro".
 *
 * First run: remember the intro was seen (so the guard resumes at step 1 next
 * time) and start the wizard. The write is fire-and-forget — failing it only
 * means the intro shows once more, never that setup can't start.
 *
 * Replay (an onboarded user who opened it from Settings › Setup): nothing to
 * remember and nothing to set up, so it goes back to Settings.
 */
export function useLeaveIntro() {
  const router = useRouter();
  const { userDoc, update } = useUserDoc();
  const replay = userDoc?.onboardingCompleted === true;

  const leave = () => {
    if (replay) {
      router.push("/settings");
      return;
    }
    if (userDoc?.onboardingIntroSeen !== true) {
      update({ onboardingIntroSeen: true }).catch((err) =>
        console.error("Failed to remember the intro was seen:", err)
      );
    }
    router.push(ONBOARDING_ENTRY);
  };

  return { replay, leave };
}
