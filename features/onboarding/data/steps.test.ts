import { ONBOARDING_STEPS, WELCOME_INTRO, stepAccent } from "./steps";
import { INTRO_SLIDES } from "./introSlides";
import { INTRO_SCENES } from "../components/intro/scenes";
import { ONBOARDING_ENTRY } from "../helpers/routes";

describe("ONBOARDING_STEPS", () => {
  it("puts Currencies right before Income, where new rows pick up its currency", () => {
    expect(ONBOARDING_STEPS.map((s) => s.label)).toEqual([
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
    expect([...intros].sort()).toEqual(Object.keys(INTRO_SLIDES).sort());
    for (const id of intros) expect(INTRO_SCENES[id]).toBeDefined();
  });

  it("keeps each summary to one short line", () => {
    for (const step of ONBOARDING_STEPS) {
      expect(step.summary.length).toBeGreaterThan(0);
      expect(step.summary.length).toBeLessThanOrEqual(60);
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

describe("INTRO_SLIDES", () => {
  it("marks a key phrase on every slide", () => {
    for (const slide of Object.values(INTRO_SLIDES)) expect(slide.body).toMatch(/\*\*.+?\*\*/);
  });
});
