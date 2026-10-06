import { render, screen, fireEvent } from "@testing-library/react";
import { OnboardingLayout, ONBOARDING_STEPS } from "./OnboardingLayout";

const pushMock = jest.fn();
const prefetchMock = jest.fn((_href: string) => Promise.resolve());

jest.mock("next/router", () => ({
  useRouter: () => ({ push: pushMock, prefetch: prefetchMock }),
}));

beforeEach(() => {
  pushMock.mockReset();
  prefetchMock.mockClear();
});

describe("OnboardingLayout", () => {
  it("prefetches every step so Next/Back don't wait on a chunk", () => {
    render(<OnboardingLayout step={1}>body</OnboardingLayout>);
    expect(prefetchMock.mock.calls.map(([href]) => href)).toEqual(
      ONBOARDING_STEPS.map((s) => s.href)
    );
  });

  it("renders the title and every step's label", () => {
    render(
      <OnboardingLayout step={1}>
        <p>body</p>
      </OnboardingLayout>
    );

    expect(screen.getByRole("heading", { name: "Build your plan" })).toBeInTheDocument();
    ONBOARDING_STEPS.forEach((s) => {
      expect(screen.getByRole("button", { name: s.label })).toBeInTheDocument();
    });
    // Icons stand in for numbers: the steps are tabs, not a forced sequence.
    expect(screen.queryByText(/^\d\. /)).not.toBeInTheDocument();
    expect(screen.getByText("body")).toBeInTheDocument();
  });

  it("marks the current step with aria-current", () => {
    render(
      <OnboardingLayout step={4}>
        <p>body</p>
      </OnboardingLayout>
    );

    const current = screen.getByRole("button", { name: "Income" });
    expect(current).toHaveAttribute("aria-current", "step");
    expect(screen.getByRole("button", { name: "Categories" })).not.toHaveAttribute("aria-current");
  });

  it("tints the Income and Expenses tabs with their domain colour", () => {
    const { container } = render(
      <OnboardingLayout step={5}>
        <p>body</p>
      </OnboardingLayout>
    );

    const tab = (label: string) =>
      screen.getByRole("button", { name: label }).closest("li") as HTMLElement;
    expect(tab("Income").style.getPropertyValue("--step-accent")).toBe("var(--domain-income)");
    expect(tab("Expenses").style.getPropertyValue("--step-accent")).toBe("var(--domain-expense)");
    expect(tab("Categories").style.getPropertyValue("--step-accent")).toBe("var(--accent)");
    // The progress fill follows the current step's colour.
    const nav = container.querySelector(".stepper") as HTMLElement;
    expect(nav.style.getPropertyValue("--current-accent")).toBe("var(--domain-expense)");
  });

  it("fills the progress bar proportionally to the step", () => {
    const { container, rerender } = render(
      <OnboardingLayout step={1}>
        <p>body</p>
      </OnboardingLayout>
    );
    expect(container.querySelector(".fill")).toHaveStyle({
      width: `${(1 / ONBOARDING_STEPS.length) * 100}%`,
    });

    rerender(
      <OnboardingLayout step={ONBOARDING_STEPS.length}>
        <p>body</p>
      </OnboardingLayout>
    );
    expect(container.querySelector(".fill")).toHaveStyle({ width: "100%" });
  });

  it("has no header back arrow: Back lives in the footer", () => {
    render(
      <OnboardingLayout step={3}>
        <p>body</p>
      </OnboardingLayout>
    );

    expect(screen.queryByRole("button", { name: "Go back" })).not.toBeInTheDocument();
  });

  it("lets the user jump to another step through onNavigate", () => {
    const onNavigate = jest.fn();
    render(
      <OnboardingLayout step={3} onNavigate={onNavigate}>
        <p>body</p>
      </OnboardingLayout>
    );

    fireEvent.click(screen.getByRole("button", { name: "Categories" }));
    expect(onNavigate).toHaveBeenCalledWith("/onboarding/categories");
    // Steps ahead are reachable too — nothing forces a linear walk.
    fireEvent.click(screen.getByRole("button", { name: "Expenses" }));
    expect(onNavigate).toHaveBeenCalledWith("/onboarding/expenses");
  });

  it("does not let a click re-enter the current step or fire while saving", () => {
    const onNavigate = jest.fn();
    const { rerender } = render(
      <OnboardingLayout step={4} onNavigate={onNavigate}>
        <p>body</p>
      </OnboardingLayout>
    );
    expect(screen.getByRole("button", { name: "Income" })).toBeDisabled();

    rerender(
      <OnboardingLayout step={4} onNavigate={onNavigate} busy>
        <p>body</p>
      </OnboardingLayout>
    );
    expect(screen.getByRole("button", { name: "Categories" })).toBeDisabled();
  });

  it("takes a custom title and leaves the stepper out when there is no step", () => {
    const { container } = render(
      <OnboardingLayout title="Welcome">
        <p>body</p>
      </OnboardingLayout>
    );

    expect(screen.getByRole("heading", { name: "Welcome" })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Setup progress" })).not.toBeInTheDocument();
    expect(container.querySelector(".fill")).toBeNull();
    expect(screen.getByText("body")).toBeInTheDocument();
  });

  it("only stretches to the screen's height when asked to fill", () => {
    const { container, rerender } = render(
      <OnboardingLayout step={1}>
        <p>body</p>
      </OnboardingLayout>
    );
    expect(container.querySelector(".layout")).not.toHaveClass("layout--fill");

    rerender(
      <OnboardingLayout title="Welcome" fill>
        <p>body</p>
      </OnboardingLayout>
    );
    expect(container.querySelector(".layout")).toHaveClass("layout--fill");
  });

  it("renders the description and footer when provided", () => {
    render(
      <OnboardingLayout
        step={2}
        description="How you pay: your cards and accounts, so each plan item knows where it is charged."
        footer={<span>actions</span>}
      >
        <p>body</p>
      </OnboardingLayout>
    );

    expect(
      screen.getByText(
        "How you pay: your cards and accounts, so each plan item knows where it is charged."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("actions")).toBeInTheDocument();
  });
});
