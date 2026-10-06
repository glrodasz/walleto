/**
 * Where onboarding starts. Kept apart from onboardingGuard, which pulls in
 * firebase-admin and Auth0's server SDK: client code imports these too.
 */

/** The first wizard step. */
export const ONBOARDING_ENTRY = "/onboarding/categories";
/** The Welcome, shown once before the wizard. */
export const ONBOARDING_INTRO = "/onboarding";
/**
 * The same page as the full six-slide tour, replayed from Settings › Setup.
 * The mode lives in the URL, not the user doc, which arrives `null` first and
 * would flash the Welcome at someone replaying.
 */
export const ONBOARDING_TOUR = `${ONBOARDING_INTRO}?tour=1`;
