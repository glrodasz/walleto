import type { ComponentType } from "react";
import { ArrowDown, ArrowUp, Check, Coins, CreditCard, Tag } from "../../../components/atoms/Icons";
import type { IconProps } from "../../../components/atoms/Icons";
import { translate } from "../../../helpers/i18n";
import type { Language } from "../../../types";
import { ONBOARDING_MESSAGES } from "../messages";
import type { IntroSlideId } from "./introSlides";

export type StepId = "categories" | "methods" | "currencies" | "incomes" | "expenses" | "review";

export interface OnboardingStep {
  id: StepId;
  href: string;
  /** Stands in for a step number: the steps are tabs, not a forced sequence. */
  Icon: ComponentType<IconProps>;
  /** The domain colour for the Income / Expenses steps; the app accent otherwise. */
  accent?: string;
  /**
   * The step's own hue, for its icon in the Welcome's overview. Never the
   * accent, which changes per build (red on staging read as an error).
   */
  tint: string;
  /** The intro slide beside this step. */
  intro: IntroSlideId;
}

/**
 * The setup, in order. Currencies comes right before Income: new income and
 * expense rows start in the currency chosen there.
 */
export const ONBOARDING_STEPS: readonly OnboardingStep[] = [
  {
    id: "categories",
    href: "/onboarding/categories",
    Icon: Tag,
    tint: "var(--setup-categories)",
    intro: "clarity",
  },
  {
    id: "methods",
    href: "/onboarding/methods",
    Icon: CreditCard,
    tint: "var(--setup-methods)",
    intro: "later",
  },
  {
    id: "currencies",
    href: "/onboarding/currencies",
    Icon: Coins,
    tint: "var(--setup-currencies)",
    intro: "currencies",
  },
  {
    id: "incomes",
    href: "/onboarding/incomes",
    Icon: ArrowUp,
    accent: "var(--domain-income)",
    tint: "var(--domain-income)",
    intro: "income",
  },
  {
    id: "expenses",
    href: "/onboarding/expenses",
    Icon: ArrowDown,
    accent: "var(--domain-expense)",
    tint: "var(--domain-expense)",
    intro: "expenses",
  },
  {
    id: "review",
    href: "/onboarding/review",
    Icon: Check,
    tint: "var(--setup-review)",
    intro: "worth",
  },
];

/** The Welcome's slide: the one screen before step 1. */
export const WELCOME_INTRO: IntroSlideId = "planner";

/** The colour a step is tinted with (stepper tab, progress fill, its panels). */
export const stepAccent = (step: OnboardingStep | undefined) => step?.accent ?? "var(--accent)";

/** A step's name (stepper tab, Welcome row). */
export const stepLabel = (id: StepId, language: Language = "en") =>
  translate(ONBOARDING_MESSAGES, language, `step.${id}.label`);

/** One line for the Welcome's "What we'll set up" (a ListItem meta: keep it short). */
export const stepSummary = (id: StepId, language: Language = "en") =>
  translate(ONBOARDING_MESSAGES, language, `step.${id}.summary`);
