import { ONBOARDING_STEPS, WELCOME_INTRO, stepAccent, stepLabel, stepSummary } from "./steps";
import { INTRO_SLIDE_IDS, introSlide } from "./introSlides";
import { INTRO_SCENES } from "../components/intro/scenes";
import { ONBOARDING_ENTRY } from "../helpers/routes";

describe("ONBOARDING_STEPS", () => {
  it("puts Currencies right before Income, where new rows pick up its currency", () => {
    expect(ONBOARDING_STEPS.map((s) => stepLabel(s.id))).toEqual([
      "Categories",
      "Payment methods",
      "Currencies",
      "Income",
      "Expenses",
      "Review",
    ]);
  });

  it("starts where the guard sends a new user, and each href is its id", () => {
    expect(ONBOARDING_STEPS[0].href).toBe(ONBOARDING_ENTRY);
    for (const step of ONBOARDING_STEPS) expect(step.href).toBe(`/onboarding/${step.id}`);
  });

  it("pairs every screen with its own slide, and every slide with a screen", () => {
    const intros = [WELCOME_INTRO, ...ONBOARDING_STEPS.map((s) => s.intro)];
    expect(new Set(intros).size).toBe(intros.length);
    expect([...intros].sort()).toEqual([...INTRO_SLIDE_IDS].sort());
    for (const id of intros) expect(INTRO_SCENES[id]).toBeDefined();
  });

  it("keeps each summary to one short line", () => {
    for (const step of ONBOARDING_STEPS) {
      for (const language of ["en", "es"] as const) {
        const summary = stepSummary(step.id, language);
        expect(summary.length).toBeGreaterThan(0);
        expect(summary.length).toBeLessThanOrEqual(60);
      }
    }
  });

  it("tints only Income and Expenses with their domain, the rest with the accent", () => {
    expect(ONBOARDING_STEPS.map(stepAccent)).toEqual([
      "var(--accent)",
      "var(--accent)",
      "var(--accent)",
      "var(--domain-income)",
      "var(--domain-expense)",
      "var(--accent)",
    ]);
  });
});

describe("overview tints", () => {
  it("gives every step its own hue, never the per-build accent", () => {
    const tints = ONBOARDING_STEPS.map((s) => s.tint);
    expect(tints).toEqual([
      "var(--setup-categories)",
      "var(--setup-methods)",
      "var(--setup-currencies)",
      "var(--domain-income)",
      "var(--domain-expense)",
      "var(--setup-review)",
    ]);
    expect(new Set(tints).size).toBe(tints.length);
  });
});

describe("introSlide", () => {
  it("marks a key phrase on every slide, in every language", () => {
    for (const id of INTRO_SLIDE_IDS) {
      expect(introSlide(id).body).toMatch(/\*\*.+?\*\*/);
      expect(introSlide(id, "es").body).toMatch(/\*\*.+?\*\*/);
    }
  });
});
