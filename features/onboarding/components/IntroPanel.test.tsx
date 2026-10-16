import { render, screen } from "@testing-library/react";
import type { IntroSlideId } from "../data/introSlides";
import { INTRO_SLIDE_IDS, introSlide } from "../data/introSlides";
import { IntroPanel } from "./IntroPanel";

const IDS: IntroSlideId[] = [...INTRO_SLIDE_IDS];

describe("IntroPanel", () => {
  it.each(IDS)("shows the %s slide: label, title, and bold key phrases", (id) => {
    const slide = introSlide(id);
    const { container } = render(<IntroPanel id={id} />);

    expect(screen.getByText(slide.label)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: slide.title })).toBeInTheDocument();
    const body = container.querySelector(".body") as HTMLElement;
    expect(body.textContent).toBe(slide.body.replaceAll("**", ""));
    expect(body.querySelector("strong")).not.toBeNull();
  });

  it.each(IDS)("draws the %s scene for the eye only", (id) => {
    const { container } = render(<IntroPanel id={id} />);
    expect(container.querySelector('.well [aria-hidden="true"]')).not.toBeNull();
  });

  it("drops to bare text when stacked, unless asked to keep the scene", () => {
    const { container, rerender } = render(<IntroPanel id="later" />);
    expect(container.querySelector(".panel")).toHaveClass("panel--bare");

    rerender(<IntroPanel id="planner" sceneWhenStacked />);
    expect(container.querySelector(".panel")).not.toHaveClass("panel--bare");
  });
});
