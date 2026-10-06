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

export const INTRO_SLIDES: Record<IntroSlideId, IntroSlide> = {
  planner: {
    label: "A planner, not a logbook",
    title: "Walleto plans your month. It doesn't log every coffee.",
    body: "No typing in **every purchase**. Walleto works from **what usually comes in and goes out**, and tells you whether the month is **on plan**.",
  },
  clarity: {
    label: "Step one: see it",
    title: "Better finances start with knowing where your money goes.",
    body: "Before cutting anything, get the picture: **what you earn**, and **where it goes** each month.",
  },
  later: {
    label: "No rush",
    title: "You don't have to set up everything today.",
    body: "Add **what you know now** and the rest **whenever you like**. You can change anything later, and run this setup again from **Settings › Setup**.",
  },
  currencies: {
    label: "Multi-currency by default",
    title: "Earn, spend and save in any currency.",
    body: "Paid in one currency, renting in another, saving in a third? Every amount **stays in its own currency**, and Walleto **converts only when it adds things up**.",
  },
  income: {
    label: "Start with the essentials",
    title: "Your main income comes first.",
    body: "Your **salary**, or whatever **reliably lands each month**. Side income can wait.",
  },
  expenses: {
    label: "Then the bills",
    title: "The bills you remember.",
    body: "Think **rent, utilities, the gym, Netflix**. The rest can wait.",
  },
  worth: {
    label: "After setup",
    title: "The bigger picture comes later.",
    body: "**Investments, savings and debts** aren't part of this setup. When you're ready, add them from their own pages and Walleto sums everything into your **net worth**.",
  },
};
