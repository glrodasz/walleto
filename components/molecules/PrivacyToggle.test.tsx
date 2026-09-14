import { fireEvent, render, screen } from "@testing-library/react";
import { PrivacyToggle } from "./PrivacyToggle";
import { Amount } from "../atoms/Amount";
import { PrivacyProvider, PRIVACY_STORAGE_KEY } from "../../hooks/usePrivacy";

function setup() {
  return render(
    <PrivacyProvider>
      <PrivacyToggle />
      <Amount value={1150} currency="USD" />
    </PrivacyProvider>
  );
}

describe("PrivacyToggle", () => {
  afterEach(() => localStorage.clear());

  it("masks every amount on the page and reveals them again", () => {
    setup();
    expect(screen.getByText(/\$1,150\.00/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Hide amounts" }));
    expect(screen.getByText(/\$\*\*\*\*/)).toBeInTheDocument();
    expect(screen.queryByText(/1,150/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Show amounts" }));
    expect(screen.getByText(/\$1,150\.00/)).toBeInTheDocument();
  });

  it("reports its state to assistive tech", () => {
    setup();
    const button = screen.getByRole("button", { name: "Hide amounts" });
    expect(button).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(button);
    expect(screen.getByRole("button", { name: "Show amounts" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("remembers the choice per browser", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Hide amounts" }));
    expect(localStorage.getItem(PRIVACY_STORAGE_KEY)).toBe("true");
  });
});
