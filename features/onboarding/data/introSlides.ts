import { translate } from "../../../helpers/i18n";
import type { Language } from "../../../types";
import { ONBOARDING_MESSAGES } from "../messages";

/**
 * The intro that runs beside the setup: one slide per screen, drawn by
 * IntroPanel (the left column on desktop, a few lines above the step
 * otherwise). Which screen shows which slide lives in data/steps.
 *
 * The id also picks the slide's scene (components/intro/scenes).
 */
export type IntroSlideId =
  | "planner"
  | "clarity"
  | "later"
  | "currencies"
  | "income"
  | "expenses"
  | "worth";

export interface IntroSlide {
  /** A short kicker above the title. */
  label: string;
  title: string;
  /**
   * `**…**` marks the words to bold, so the slide can be scanned at a glance.
   * Keep it to a phrase or two: bold everything and nothing stands out.
   */
  body: string;
}

/** Every slide, in the order the setup shows them. */
export const INTRO_SLIDE_IDS: readonly IntroSlideId[] = [
  "planner",
  "clarity",
  "later",
  "currencies",
  "income",
  "expenses",
  "worth",
];

/** A slide's copy in the user's language (the catalog is `messages.ts`). */
export function introSlide(id: IntroSlideId, language: Language = "en"): IntroSlide {
  return {
    label: translate(ONBOARDING_MESSAGES, language, `slide.${id}.label`),
    title: translate(ONBOARDING_MESSAGES, language, `slide.${id}.title`),
    body: translate(ONBOARDING_MESSAGES, language, `slide.${id}.body`),
  };
}
