import { fireEvent, render, screen } from "@testing-library/react";
import { LanguageToggle } from "./LanguageToggle";

let router = { locale: "en", asPath: "/expenses?month=2026-09#activity" };
jest.mock("next/router", () => ({ useRouter: () => router }));

afterEach(() => {
  document.cookie = "locale=; path=/; max-age=0";
});

describe("LanguageToggle", () => {
  it("links an English page to its Spanish counterpart, keeping query and hash", () => {
    router = { locale: "en", asPath: "/expenses?month=2026-09#activity" };
    render(<LanguageToggle />);
    const link = screen.getByRole("link", { name: "Cambiar a español" });
    expect(link).toHaveAttribute("href", "/es/expenses?month=2026-09#activity");
    expect(link).toHaveAttribute("hreflang", "es");
    expect(link).toHaveAttribute("lang", "es");
    expect(link).toHaveTextContent("Español");
  });

  it("links a Spanish page back to English", () => {
    router = { locale: "es", asPath: "/?month=2026-09" };
    render(<LanguageToggle />);
    const link = screen.getByRole("link", { name: "Switch to English" });
    expect(link).toHaveAttribute("href", "/?month=2026-09");
    expect(link).toHaveTextContent("English");
  });

  it("remembers the choice on click", () => {
    router = { locale: "en", asPath: "/settings" };
    render(<LanguageToggle />);
    fireEvent.click(screen.getByRole("link", { name: "Cambiar a español" }));
    expect(document.cookie).toContain("locale=es");
  });
});
