import { fireEvent, render, screen } from "@testing-library/react";
import type { UserDoc } from "../../../hooks/useUserDoc";
import { INTRO_SLIDES } from "../data/introSlides";

const push = jest.fn();
const update = jest.fn();
let userDoc: Partial<UserDoc> | null = null;

jest.mock("next/router", () => ({
  useRouter: () => ({ push, prefetch: () => Promise.resolve() }),
}));
jest.mock("../../../hooks/useUserDoc", () => ({ useUserDoc: () => ({ userDoc, update }) }));

import { IntroPage } from "./IntroPage";

const heading = () => screen.getByRole("heading", { level: 2 });
const next = () => fireEvent.click(screen.getByRole("button", { name: /^Next/ }));

beforeEach(() => {
  push.mockReset();
  update.mockReset().mockResolvedValue(undefined);
  userDoc = { onboardingCompleted: false };
});

describe("IntroPage", () => {
  it("opens on the first slide, with no Back and no header arrow", () => {
    render(<IntroPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Welcome" })).toBeInTheDocument();
    expect(heading()).toHaveTextContent(INTRO_SLIDES[0].title);
    expect(screen.queryByRole("button", { name: /Back/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Go back" })).not.toBeInTheDocument();
  });

  it("moves through the slides with Next and Back", () => {
    render(<IntroPage />);
    next();
    expect(heading()).toHaveTextContent(INTRO_SLIDES[1].title);

    fireEvent.click(screen.getByRole("button", { name: /Back/ }));
    expect(heading()).toHaveTextContent(INTRO_SLIDES[0].title);
  });

  it("moves with the arrow keys too", () => {
    render(<IntroPage />);
    fireEvent.keyDown(window, { key: "ArrowRight" });
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(heading()).toHaveTextContent(INTRO_SLIDES[2].title);

    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(heading()).toHaveTextContent(INTRO_SLIDES[1].title);
  });

  it("jumps to a slide from its dot and marks it current", () => {
    render(<IntroPage />);
    const dot = screen.getByRole("button", { name: `Slide 4 of ${INTRO_SLIDES.length}` });
    fireEvent.click(dot);
    expect(heading()).toHaveTextContent(INTRO_SLIDES[3].title);
    expect(dot).toHaveAttribute("aria-current", "step");
  });

  it("ends on Start setup, which starts the wizard", () => {
    render(<IntroPage />);
    for (let n = 1; n < INTRO_SLIDES.length; n++) next();
    expect(heading()).toHaveTextContent(INTRO_SLIDES[INTRO_SLIDES.length - 1].title);
    // The last slide's primary button already leaves, so the skip link goes.
    expect(screen.queryByRole("button", { name: "Skip intro" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Start setup/ }));
    expect(update).toHaveBeenCalledWith({ onboardingIntroSeen: true });
    expect(push).toHaveBeenCalledWith("/onboarding/categories");
  });

  it("can be skipped from any slide", () => {
    render(<IntroPage />);
    next();
    fireEvent.click(screen.getByRole("button", { name: "Skip intro" }));
    expect(update).toHaveBeenCalledWith({ onboardingIntroSeen: true });
    expect(push).toHaveBeenCalledWith("/onboarding/categories");
  });

  it("on a replay from Settings, closes back to Settings", () => {
    userDoc = { onboardingCompleted: true, onboardingIntroSeen: true };
    render(<IntroPage />);
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(push).toHaveBeenCalledWith("/settings");

    for (let n = 1; n < INTRO_SLIDES.length; n++) next();
    expect(screen.getByRole("button", { name: /Done/ })).toBeInTheDocument();
    expect(update).not.toHaveBeenCalled();
  });
});
