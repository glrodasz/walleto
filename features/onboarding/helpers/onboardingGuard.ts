import type { GetServerSideProps } from "next";
import auth0 from "../../../lib/auth0";
import admin from "../../../firebase/admin";

export const ONBOARDING_ENTRY = "/onboarding/categories";

/**
 * Page guard for authenticated routes that also require finished onboarding.
 *
 * Drop-in replacement for `auth0.withPageAuthRequired()`. The user doc is
 * created lazily by /api/firebase, so a missing doc means "brand new user" and
 * is treated as not-onboarded.
 *
 * The wizard routes deliberately do NOT use this — they stay on plain
 * withPageAuthRequired, which keeps the redirect target reachable (no loop) and
 * lets a finished user re-run setup.
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

      try {
        const snap = await admin.firestore().collection("users").doc(userId).get();
        if (snap.data()?.onboardingCompleted === true) {
          return { props: {} };
        }
      } catch (err) {
        // Firestore being unreachable shouldn't lock the user out of the app.
        console.error("[withOnboardingGuard] failed to read user doc:", err);
        return { props: {} };
      }

      return {
        redirect: { destination: ONBOARDING_ENTRY, permanent: false },
      };
    },
  }) as GetServerSideProps;
}
