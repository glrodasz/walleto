import { fireEvent, render, screen } from "@testing-library/react";
import type { UserDoc } from "../../../hooks/useUserDoc";
import { INTRO_SLIDES, WELCOME } from "../data/introSlides";
import { ONBOARDING_STEPS } from "./OnboardingLayout";

const push = jest.fn();
const update = jest.fn();
let userDoc: Partial<UserDoc> | null = null;
let query: Record<string, string> = {};
let isReady = true;

jest.mock("next/router", () => ({
  useRouter: () => ({ push, prefetch: () => Promise.resolve(), query, isReady }),
}));
jest.mock("../../../hooks/useUserDoc", () => ({ useUserDoc: () => ({ userDoc, update }) }));

import { IntroPage } from "./IntroPage";

const heading = () => screen.getByRole("heading", { level: 2 });
const next = () => fireEvent.click(screen.getByRole("button", { name: /^Next/ }));

beforeEach(() => {
  push.mockReset();
  update.mockReset().mockResolvedValue(undefined);
  userDoc = { onboardingCompleted: false };
  query = {};
  isReady = true;
});

describe("IntroPage — first run: the Welcome", () => {
  it("is one screen: no dots, no Back, no skip link", () => {
    render(<IntroPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Welcome" })).toBeInTheDocument();
    expect(heading()).toHaveTextContent(WELCOME.title);
    expect(screen.queryByRole("button", { name: /^Slide \d/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Back/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Next/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Skip intro" })).not.toBeInTheDocument();
  });

  it("bolds the marked key phrases and never shows the markers", () => {
    render(<IntroPage />);
    const body = heading().nextElementSibling as HTMLElement;
    expect(body.textContent).not.toContain("**");
    expect(body.querySelector("strong")).not.toBeNull();
  });

  it("previews every setup step, none of them current or clickable", () => {
    render(<IntroPage />);
    const stepper = screen.getByRole("navigation", { name: "Setup progress" });
    for (const step of ONBOARDING_STEPS) {
      const tab = screen.getByRole("button", { name: step.label });
      expect(stepper).toContainElement(tab);
      expect(tab).toBeDisabled();
      expect(tab).not.toHaveAttribute("aria-current");
    }
  });

  it("Start setup remembers the intro and starts the wizard", () => {
    render(<IntroPage />);
    fireEvent.click(screen.getByRole("button", { name: /Start setup/ }));
    expect(update).toHaveBeenCalledWith({ onboardingIntroSeen: true });
    expect(push).toHaveBeenCalledWith("/onboarding/categories");
  });

  it("ignores the arrow keys: there is nothing to step through", () => {
    render(<IntroPage />);
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(heading()).toHaveTextContent(WELCOME.title);
  });

  it("shows while the user doc is still loading", () => {
    userDoc = null;
    render(<IntroPage />);
    expect(heading()).toHaveTextContent(WELCOME.title);
  });
});

describe("IntroPage — ?tour=1: the full tour from Settings", () => {
  beforeEach(() => {
    query = { tour: "1" };
    userDoc = { onboardingCompleted: true, onboardingIntroSeen: true };
  });

  it("opens on the first slide, with no Back and no stepper", () => {
    render(<IntroPage />);
    expect(heading()).toHaveTextContent(INTRO_SLIDES[0].title);
    expect(screen.queryByRole("button", { name: /Back/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Setup progress" })).not.toBeInTheDocument();
  });

  it("bolds the marked key phrases on every slide", () => {
    render(<IntroPage />);
    for (let n = 0; n < INTRO_SLIDES.length; n++) {
      const body = heading().nextElementSibling as HTMLElement;
      expect(body.textContent).not.toContain("**");
      expect(body.querySelector("strong")).not.toBeNull();
      if (n < INTRO_SLIDES.length - 1) next();
    }
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

  it("closes back to Settings from any slide, without writing anything", () => {
    render(<IntroPage />);
    next();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(push).toHaveBeenCalledWith("/settings");
    expect(update).not.toHaveBeenCalled();
  });

  it("ends on Done, which goes back to Settings", () => {
    render(<IntroPage />);
    for (let n = 1; n < INTRO_SLIDES.length; n++) next();
    // The last slide's primary button already leaves, so the close link goes.
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Done/ }));
    expect(push).toHaveBeenCalledWith("/settings");
    expect(update).not.toHaveBeenCalled();
  });

  it("is the tour even before the user doc loads, so the Welcome never flashes", () => {
    userDoc = null;
    render(<IntroPage />);
    expect(heading()).toHaveTextContent(INTRO_SLIDES[0].title);
  });
});

describe("IntroPage — before the router is ready", () => {
  it("renders nothing until it knows which intro to show", () => {
    isReady = false;
    const { container } = render(<IntroPage />);
    expect(container).toBeEmptyDOMElement();
  });
});
