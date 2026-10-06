import { ONBOARDING_STEPS } from "../data/steps";
import type { StepId } from "../data/steps";

/**
 * A step's number and its neighbours, from the one ordered list, so no page
 * hardcodes where Back and Next go. Takes the typed id (not an href): a typo
 * fails the typecheck instead of a page nobody renders at build time.
 */
export function stepNav(id: StepId): { step: number; back?: string; next?: string } {
  const i = ONBOARDING_STEPS.findIndex((s) => s.id === id);
  return {
    step: i + 1,
    back: ONBOARDING_STEPS[i - 1]?.href,
    next: ONBOARDING_STEPS[i + 1]?.href,
  };
}
