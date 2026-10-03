/**
 * Where onboarding starts. Kept apart from onboardingGuard, which pulls in
 * firebase-admin and Auth0's server SDK: client code imports these too.
 */

/** The first wizard step. */
export const ONBOARDING_ENTRY = "/onboarding/categories";
/** The animated "what is Walleto" intro, shown once before the wizard. */
export const ONBOARDING_INTRO = "/onboarding";
