/**
 * The "what is Walleto" intro, one entry per Next. The copy sets
 * expectations before setup starts: a planner rather than a logbook, start by
 * seeing where the money goes, nothing has to be finished today.
 *
 * `id` also picks the scene IntroStage draws above the text.
 */
export type IntroSlideId = "planner" | "clarity" | "later" | "essentials" | "worth" | "currencies";

export interface IntroSlide {
  id: IntroSlideId;
  /** A short kicker above the title. */
  label: string;
  title: string;
  /**
   * `**…**` marks the words to bold, so the slide can be scanned at a glance.
   * Keep it to a phrase or two: bold everything and nothing stands out.
   */
  body: string;
}

export const INTRO_SLIDES: readonly IntroSlide[] = [
  {
    id: "planner",
    label: "A planner, not a logbook",
    title: "Walleto plans your month. It doesn't log every coffee.",
    body: "No typing in **every purchase**. Walleto works from **what usually comes in and goes out**, and tells you whether the month is **on plan**.",
  },
  {
    id: "clarity",
    label: "Step one: see it",
    title: "Better finances start with knowing where your money goes.",
    body: "Before cutting anything, get the picture: **what you earn**, and **where it goes** each month.",
  },
  {
    id: "later",
    label: "No rush",
    title: "You don't have to set up everything today.",
    body: "Add **what you know now** and the rest **whenever you like**. You can change anything later, and run this setup again from **Settings › Setup**.",
  },
  {
    id: "essentials",
    label: "Start with the essentials",
    title: "Your main income, how you pay, and the bills you remember.",
    body: "Think **rent, utilities, the gym, Netflix**. The rest can wait.",
  },
  {
    id: "worth",
    label: "After setup",
    title: "Investments, savings and debts come later.",
    body: "They're **not part of this setup**. When you're ready, add them from their own pages and Walleto sums everything into your **net worth**.",
  },
  {
    id: "currencies",
    label: "Multi-currency by default",
    title: "Earn, spend and save in any currency.",
    body: "Paid in one currency, renting in another, saving in a third? Every amount **stays in its own currency**, and Walleto **converts only when it adds things up**.",
  },
];
