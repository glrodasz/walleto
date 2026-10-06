import { render, screen } from "@testing-library/react";
import type { IntroSlideId } from "../data/introSlides";
import { introSlide } from "../data/introSlides";
import { StepLead } from "./StepLead";

const LEADS: IntroSlideId[] = ["currencies", "essentials", "worth"];

describe("StepLead", () => {
  it.each(LEADS)("leads with the %s slide's own label and body", (id) => {
    const slide = introSlide(id);
    const { container } = render(<StepLead id={id} />);

    expect(screen.getByText(slide.label)).toBeInTheDocument();
    const body = container.querySelector(".body") as HTMLElement;
    // Bold key phrases, never the markers.
    expect(body.textContent).not.toContain("**");
    expect(body.textContent).toBe(slide.body.replaceAll("**", ""));
    expect(body.querySelector("strong")).not.toBeNull();
  });

  it.each(LEADS)("draws the %s scene for the eye only, with no heading", (id) => {
    const { container } = render(<StepLead id={id} />);
    expect(container.querySelector('.scene [aria-hidden="true"]')).not.toBeNull();
    // The step keeps its own heading structure.
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });
});
