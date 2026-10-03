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
  body: string;
}

export const INTRO_SLIDES: readonly IntroSlide[] = [
  {
    id: "planner",
    label: "A planner, not a logbook",
    title: "Walleto plans your month. It doesn't log every coffee.",
    body: "Most money apps want every purchase typed in. Walleto works from what usually comes in and goes out, and tells you whether the month is on plan.",
  },
  {
    id: "clarity",
    label: "Step one: see it",
    title: "Better finances start with knowing where your money goes.",
    body: "Before cutting anything, get the picture: what you earn, and where it goes each month.",
  },
  {
    id: "later",
    label: "No rush",
    title: "You don't have to set up everything today.",
    body: "Add what you know now and fill in the rest whenever you like. Everything can be changed in Settings, and this setup can be run again from Settings › Setup.",
  },
  {
    id: "essentials",
    label: "Start with the essentials",
    title: "Your main income, how you pay, and the bills you remember.",
    body: "Categories come ready-made. Then add your main income, the account or card you usually pay with, and the expenses you know by heart: rent, utilities, the gym, Netflix. Anything you forget can be added later.",
  },
  {
    id: "worth",
    label: "Then, the bigger picture",
    title: "Add investments, savings and debts to see your net worth.",
    body: "Whenever you're ready, add the accounts where your money lives and what you owe. Walleto adds them up into your net worth.",
  },
  {
    id: "currencies",
    label: "Multi-currency by default",
    title: "Earn, spend and save in any currency.",
    body: "Paid in one currency, renting in another, saving in a third? Every amount stays in its own currency, and Walleto converts only when it adds things up.",
  },
];
