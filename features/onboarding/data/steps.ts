import type { ComponentType } from "react";
import { ArrowDown, ArrowUp, Check, Coins, CreditCard, Tag } from "../../../components/atoms/Icons";
import type { IconProps } from "../../../components/atoms/Icons";
import type { IntroSlideId } from "./introSlides";

export type StepId = "categories" | "methods" | "currencies" | "incomes" | "expenses" | "review";

export interface OnboardingStep {
  id: StepId;
  label: string;
  href: string;
  /** Stands in for a step number: the steps are tabs, not a forced sequence. */
  Icon: ComponentType<IconProps>;
  /** The domain colour for the Income / Expenses steps; the app accent otherwise. */
  accent?: string;
  /** The intro slide beside this step. */
  intro: IntroSlideId;
  /** One line for the Welcome's "What we'll set up" (a ListItem meta: keep it short). */
  summary: string;
}

/**
 * The setup, in order. Currencies comes right before Income: new income and
 * expense rows start in the currency chosen there.
 */
export const ONBOARDING_STEPS: readonly OnboardingStep[] = [
  {
    id: "categories",
    label: "Categories",
    href: "/onboarding/categories",
    Icon: Tag,
    intro: "clarity",
    summary: "How your plan is sorted. Keep the defaults or add your own.",
  },
  {
    id: "methods",
    label: "Payment methods",
    href: "/onboarding/methods",
    Icon: CreditCard,
    intro: "later",
    summary: "The cards and accounts your bills are charged to.",
  },
  {
    id: "currencies",
    label: "Currencies",
    href: "/onboarding/currencies",
    Icon: Coins,
    intro: "currencies",
    summary: "The currency you plan in, and any others you use.",
  },
  {
    id: "incomes",
    label: "Income",
    href: "/onboarding/incomes",
    Icon: ArrowUp,
    accent: "var(--domain-income)",
    intro: "income",
    summary: "Your salary, or whatever lands each month.",
  },
  {
    id: "expenses",
    label: "Expenses",
    href: "/onboarding/expenses",
    Icon: ArrowDown,
    accent: "var(--domain-expense)",
    intro: "expenses",
    summary: "Rent, utilities, subscriptions: the bills you remember.",
  },
  {
    id: "review",
    label: "Review",
    href: "/onboarding/review",
    Icon: Check,
    intro: "worth",
    summary: "Your plan as the dashboard will show it.",
  },
];

/** The Welcome's slide: the one screen before step 1. */
export const WELCOME_INTRO: IntroSlideId = "planner";

/** The colour a step is tinted with (stepper tab, progress fill, its panels). */
export const stepAccent = (step: OnboardingStep | undefined) => step?.accent ?? "var(--accent)";
