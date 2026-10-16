import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { LanguageToggle } from "./LanguageToggle";
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
        <LanguageToggle />
      </PreferencesContext.Provider>
    </SetLanguageContext.Provider>
  );
}

describe("LanguageToggle", () => {
  it("offers Spanish in Spanish while reading English", () => {
    render(<Harness initial="en" />);
    const toggle = screen.getByRole("button", { name: "Cambiar a español" });
    expect(toggle).toHaveAttribute("lang", "es");
    expect(toggle).toHaveTextContent("Español");
  });

  it("switches and then offers English back", () => {
    render(<Harness initial="en" />);
    fireEvent.click(screen.getByRole("button", { name: "Cambiar a español" }));
    const back = screen.getByRole("button", { name: "Switch to English" });
    expect(back).toHaveTextContent("English");
  });
});
