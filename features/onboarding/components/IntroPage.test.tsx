import { fireEvent, render, screen, within } from "@testing-library/react";
import type { UserDoc } from "../../../hooks/useUserDoc";
import { INTRO_SLIDES } from "../data/introSlides";
import { ONBOARDING_STEPS, WELCOME_INTRO } from "../data/steps";

const push = jest.fn();
const update = jest.fn();
let userDoc: Partial<UserDoc> | null = null;

jest.mock("next/router", () => ({
  useRouter: () => ({ push, prefetch: () => Promise.resolve() }),
}));
jest.mock("../../../hooks/useUserDoc", () => ({ useUserDoc: () => ({ userDoc, update }) }));

import { IntroPage } from "./IntroPage";

const welcome = INTRO_SLIDES[WELCOME_INTRO];

beforeEach(() => {
  push.mockReset();
  update.mockReset().mockResolvedValue(undefined);
  userDoc = { onboardingCompleted: false };
});

describe("IntroPage — the Welcome", () => {
  it("leads with the planner slide, bold key phrases and no markers", () => {
    render(<IntroPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Welcome" })).toBeInTheDocument();
    const title = screen.getByRole("heading", { level: 2, name: welcome.title });
    const body = title.nextElementSibling as HTMLElement;
    expect(body.textContent).not.toContain("**");
    expect(body.querySelector("strong")).not.toBeNull();
  });

  it("is not a step: no stepper, no Back, no way to skip", () => {
    render(<IntroPage />);
    expect(screen.queryByRole("navigation", { name: "Setup progress" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Back/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Skip/ })).not.toBeInTheDocument();
  });

  it("lists every setup step ahead, in order, with its summary", () => {
    render(<IntroPage />);
    const heading = screen.getByRole("heading", { level: 2, name: "What we'll set up" });
    const rows = within(heading.closest(".card") as HTMLElement).getAllByRole("listitem");
    expect(rows).toHaveLength(ONBOARDING_STEPS.length);
    ONBOARDING_STEPS.forEach((step, n) => {
      expect(rows[n]).toHaveTextContent(step.label);
      expect(rows[n]).toHaveTextContent(step.summary);
    });
  });

  it("Start setup remembers the Welcome and starts the wizard", () => {
    render(<IntroPage />);
    fireEvent.click(screen.getByRole("button", { name: /Start setup/ }));
    expect(update).toHaveBeenCalledWith({ onboardingIntroSeen: true });
    expect(push).toHaveBeenCalledWith("/onboarding/categories");
  });

  it("shows while the user doc is still loading", () => {
    userDoc = null;
    render(<IntroPage />);
    expect(screen.getByRole("heading", { level: 2, name: welcome.title })).toBeInTheDocument();
  });
});
