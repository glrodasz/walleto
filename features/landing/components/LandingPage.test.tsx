import { render, screen } from "@testing-library/react";
import { LandingPage } from "./LandingPage";

describe("LandingPage", () => {
  it("speaks the language it is given and sends visitors to Auth0", () => {
    render(<LandingPage language="es" origin="https://walleto.app" />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Tu plan de dinero, mes\u00a0a\u00a0mes." })
    ).toBeInTheDocument();
    for (const link of screen.getAllByRole("link", { name: /^Entrar/ })) {
      expect(link).toHaveAttribute("href", "/api/auth/login?ui_locales=es");
    }
    const toEnglish = screen.getByRole("link", { name: "Switch to English" });
    expect(toEnglish).toHaveAttribute("href", "/en");
    expect(toEnglish).toHaveTextContent("English");
  });

  it("shows every feature, drawn rather than captured", () => {
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
    expect(screen.getByRole("img", { name: /^Illustration of Walleto/ })).toBeInTheDocument();
  });

  it("offers a signed-in visitor the app instead of a new account", () => {
    render(<LandingPage language="en" origin="https://walleto.app" signedIn />);

    expect(screen.queryByRole("link", { name: /Sign in/ })).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Open Walleto/ })[0]).toHaveAttribute("href", "/");
  });
});
