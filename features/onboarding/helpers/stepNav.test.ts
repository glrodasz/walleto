import { stepNav } from "./stepNav";
import { ONBOARDING_STEPS } from "../data/steps";

describe("stepNav", () => {
  it("numbers each step from 1, in order", () => {
    ONBOARDING_STEPS.forEach((s, i) => expect(stepNav(s.id).step).toBe(i + 1));
  });

  it("links each step to its neighbours", () => {
    ONBOARDING_STEPS.forEach((s, i) => {
      const { back, next } = stepNav(s.id);
      expect(back).toBe(ONBOARDING_STEPS[i - 1]?.href);
      expect(next).toBe(ONBOARDING_STEPS[i + 1]?.href);
    });
  });

  it("has nothing before the first step or after the last", () => {
    expect(stepNav("categories").back).toBeUndefined();
    expect(stepNav("review").next).toBeUndefined();
  });

  it("goes from payment methods to currencies, and currencies to income", () => {
    expect(stepNav("methods")).toEqual({
      step: 2,
      back: "/onboarding/categories",
      next: "/onboarding/currencies",
    });
    expect(stepNav("currencies").next).toBe("/onboarding/incomes");
    expect(stepNav("incomes").back).toBe("/onboarding/currencies");
  });
});
