/**
 * Where onboarding starts. Kept apart from onboardingGuard, which pulls in
 * firebase-admin and Auth0's server SDK: client code imports these too.
 */

/** The first wizard step. */
export const ONBOARDING_ENTRY = "/onboarding/categories";
/** The Welcome, before step 1: once for a new user, and on "Run setup again". */
export const ONBOARDING_INTRO = "/onboarding";
