import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { LanguageMenu, LanguagePreference } from "./LanguageMenu";
import {
  DEFAULT_PREFERENCES,
  PreferencesContext,
  SetLanguageContext,
} from "../../hooks/usePreferences";
import type { Language } from "../../types";

function Harness({ initial }: { initial: Language }) {
  const [language, setLanguage] = useState<Language>(initial);
  return (
    <SetLanguageContext.Provider value={setLanguage}>
      <PreferencesContext.Provider value={{ ...DEFAULT_PREFERENCES, language }}>
        <LanguagePreference />
      </PreferencesContext.Provider>
    </SetLanguageContext.Provider>
  );
}

describe("LanguageMenu", () => {
  it("names the current language and offers every language in its own name", () => {
    render(<Harness initial="en" />);
    const trigger = screen.getByRole("button", { name: "Language: English" });
    fireEvent.click(trigger);
    const options = screen.getAllByRole("menuitemradio");
    expect(options.map((o) => o.textContent)).toEqual(["English", "Español", "Português"]);
    expect(options.map((o) => o.getAttribute("lang"))).toEqual(["en", "es", "pt"]);
    expect(screen.getByRole("menuitemradio", { name: "English" })).toHaveAttribute(
      "aria-checked",
      "true"
    );
  });

  it("switches in place and then speaks the new language", () => {
    render(<Harness initial="en" />);
    fireEvent.click(screen.getByRole("button", { name: "Language: English" }));
    fireEvent.click(screen.getByRole("menuitemradio", { name: "Português" }));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Idioma: Português" })).toBeInTheDocument();
  });

  it("links to each language's page when it has one", () => {
    render(<LanguageMenu language="es" hrefFor={(language) => `/${language}`} />);
    fireEvent.click(screen.getByRole("button", { name: "Idioma: Español" }));
    const pt = screen.getByRole("menuitemradio", { name: "Português" });
    expect(pt).toHaveAttribute("href", "/pt");
    expect(pt).toHaveAttribute("hreflang", "pt");
  });

  it("opens above the pill when there is no room below it", () => {
    render(<LanguageMenu language="en" onSelect={() => {}} />);
    const trigger = screen.getByRole("button", { name: "Language: English" });
    const rect = (top: number, height: number) =>
      ({ top, bottom: top + height, left: 0, right: 120, width: 120, height }) as DOMRect;
    jest.spyOn(trigger, "getBoundingClientRect").mockReturnValue(rect(window.innerHeight - 50, 40));
    jest.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
      this: HTMLElement
    ) {
      return this === trigger ? rect(window.innerHeight - 50, 40) : rect(0, 150);
    });
    fireEvent.click(trigger);
    const top = parseFloat(screen.getByRole("menu").style.top);
    expect(top).toBe(window.innerHeight - 50 - 6 - 150);
  });
});
