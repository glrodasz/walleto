import { useRouter } from "next/router";
import { useUserDoc } from "../../../hooks/useUserDoc";
import { ONBOARDING_ENTRY } from "../helpers/routes";

/**
 * Which intro /onboarding shows, and the way out of it.
 *
 * First run (the Welcome): remember the intro was seen (so the guard resumes
 * at step 1 next time) and start the wizard. The write is fire-and-forget —
 * failing it only means the Welcome shows once more, never that setup can't
 * start.
 *
 * Replay (`?tour=1`, from Settings › Setup): the full tour, with nothing to
 * remember and nothing to set up, so it goes back to Settings. The mode comes
 * from the URL, never the user doc: that arrives `null` first, and reading it
 * would flash the Welcome before the tour. `ready` is false until the router
 * has parsed the query (a hard reload of the static page).
 */
export function useLeaveIntro() {
  const router = useRouter();
  const { userDoc, update } = useUserDoc();
  const ready = router.isReady;
  const replay = router.query.tour === "1";

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

  return { ready, replay, leave };
}
