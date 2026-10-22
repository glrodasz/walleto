import { render, screen } from "@testing-library/react";
import { LandingPage } from "./LandingPage";

describe("LandingPage", () => {
  it("speaks the language it is given and sends sign-ups to Auth0", () => {
    render(<LandingPage language="es" origin="https://walleto.app" />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Tu plan de dinero, mes a mes." })
    ).toBeInTheDocument();
    const signUps = screen.getAllByRole("link", { name: /Crea tu cuenta/ });
    expect(signUps[0]).toHaveAttribute("href", "/api/auth/login?screen_hint=signup&ui_locales=es");
    expect(screen.getByRole("link", { name: "English" })).toHaveAttribute("href", "/en");
  });

  it("shows every feature with its screenshot", () => {
    render(<LandingPage language="en" origin="https://walleto.app" />);

    for (const title of [
      "Know what's left to allocate",
      "This month, as a checklist",
      "Bills that never cost the same",
      "Every currency, one total",
      "What you're worth, today",
      "If your income stopped today",
    ]) {
      expect(screen.getByRole("heading", { level: 3, name: title })).toBeInTheDocument();
    }
    expect(screen.getByAltText("Emergency mode: how long the cushion lasts.")).toHaveAttribute(
      "src",
      expect.stringContaining("landing%2Fen%2Fprospect.webp")
    );
  });

  it("offers a signed-in visitor the app instead of a new account", () => {
    render(<LandingPage language="en" origin="https://walleto.app" signedIn />);

    expect(screen.queryByRole("link", { name: /Create/ })).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Open Walleto/ })[0]).toHaveAttribute("href", "/");
  });
});
