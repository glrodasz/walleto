import { useRouter } from "next/router";
import { useUserDoc } from "../../../hooks/useUserDoc";
import { ONBOARDING_ENTRY } from "../helpers/routes";

/**
 * "Start setup" on the Welcome: remember it was seen (so the guard resumes at
 * step 1 next time) and start the wizard. The write is fire-and-forget —
 * failing it only means the Welcome shows once more, never that setup can't
 * start.
 */
export function useLeaveIntro() {
  const router = useRouter();
  const { userDoc, update } = useUserDoc();

  const leave = () => {
    if (userDoc?.onboardingIntroSeen !== true) {
      update({ onboardingIntroSeen: true }).catch((err) =>
        console.error("Failed to remember the intro was seen:", err)
      );
    }
    router.push(ONBOARDING_ENTRY);
  };

  return { leave };
}
