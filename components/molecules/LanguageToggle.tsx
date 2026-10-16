import { Globe } from "../atoms/Icons";
import { translate } from "../../helpers/i18n";
import { DEFAULT_LOCALE, LANGUAGE_NAMES, LOCALES } from "../../i18n/locale";
import { usePreferences, useSetLanguage } from "../../hooks/usePreferences";
import { UI_MESSAGES } from "../../messages/ui";

/**
 * "Español" while reading English, "English" while reading Spanish. Labelled
 * in the target language (people scan for theirs, and `lang` makes a screen
 * reader voice it right); a tap saves the choice in the `locale` cookie and
 * re-renders in place — there are no per-language URLs to move to.
 */
export function LanguageToggle() {
  const { language } = usePreferences();
  const setLanguage = useSetLanguage();
  const target = LOCALES.find((locale) => locale !== language) ?? DEFAULT_LOCALE;

  return (
    <button
      type="button"
      className="glass glass--tap toggle"
      lang={target}
      aria-label={translate(UI_MESSAGES, target, "language.switchTo")}
      onClick={() => setLanguage(target)}
    >
      <Globe size={14} />
      <span>{LANGUAGE_NAMES[target]}</span>
      <style jsx>{`
        .toggle {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-height: 36px;
          padding: 0 14px;
          border-radius: var(--r-pill);
          color: var(--fg-0);
          font: inherit;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
        }
        .toggle:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }
      `}</style>
    </button>
  );
}
