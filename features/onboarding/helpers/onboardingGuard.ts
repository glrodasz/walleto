import type { GetServerSideProps } from "next";
import auth0 from "../../../lib/auth0";
import admin from "../../../firebase/admin";
import { ONBOARDING_ENTRY, ONBOARDING_INTRO } from "./routes";

export { ONBOARDING_ENTRY, ONBOARDING_INTRO };
export const ONBOARDED_SESSION_KEY = "onboarded";

/**
 * Page guard for authenticated routes that also require finished onboarding.
 *
 * Drop-in replacement for `auth0.withPageAuthRequired()`. The user doc is
 * created lazily by /api/firebase, so a missing doc means "brand new user" and
 * is treated as not-onboarded.
 *
 * The wizard routes deliberately do NOT use this — they use Auth0's client-side
 * withPageAuthRequired (static pages, so steps switch without a server round
 * trip), which keeps the redirect target reachable (no loop) and lets a
 * finished user re-run setup.
 *
 * Getting through costs a Firestore read, and in the Pages Router this runs on
 * every client-side navigation too. So once the doc says "onboarded", the flag
 * is cached in the Auth0 session (`ONBOARDED_SESSION_KEY`) and later requests
 * skip the read. PATCH /api/user keeps the flag in sync when setup is re-run.
 *
 * The same read decides where an unfinished user lands: the intro until it has
 * been seen once (`onboardingIntroSeen`), the first wizard step after that.
 */
export function withOnboardingGuard(): GetServerSideProps {
  return auth0.withPageAuthRequired({
    async getServerSideProps(ctx) {
      const session = await auth0.getSession(ctx.req, ctx.res);
      const userId = session?.user?.sub;

      if (!userId) {
        // withPageAuthRequired already handles this; belt and braces.
        return { props: {} };
      }
      if (session[ONBOARDED_SESSION_KEY] === true) {
        return { props: {} };
      }

      let introSeen = false;
      try {
        const snap = await admin.firestore().collection("users").doc(userId).get();
        const data = snap.data();
        if (data?.onboardingCompleted === true) {
          await auth0.updateSession(ctx.req, ctx.res, {
            ...session,
            [ONBOARDED_SESSION_KEY]: true,
          });
          return { props: {} };
        }
        introSeen = data?.onboardingIntroSeen === true;
      } catch (err) {
        // Firestore being unreachable shouldn't lock the user out of the app.
        console.error("[withOnboardingGuard] failed to read user doc:", err);
        return { props: {} };
      }

      return {
        redirect: {
          destination: introSeen ? ONBOARDING_ENTRY : ONBOARDING_INTRO,
          permanent: false,
        },
      };
    },
  }) as GetServerSideProps;
}
