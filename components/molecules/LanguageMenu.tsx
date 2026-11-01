import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Check, ChevronDown, Globe } from "../atoms/Icons";
import { translate } from "../../helpers/i18n";
import { LANGUAGE_NAMES, LOCALES } from "../../i18n/locale";
import { useOverlayLayer } from "../../hooks/useOverlayLayer";
import { usePreferences, useSetLanguage } from "../../hooks/usePreferences";
import { UI_MESSAGES } from "../../messages/ui";
import type { Language } from "../../types";

/** Distance between the pill and the menu. */
const GAP = 6;
/** Room kept free between the menu and the viewport's edges. */
const EDGE = 8;

interface Props {
  /** The language the page is in now. */
  language: Language;
  /** Each language's own page (the landing's /en, /es, /pt): the options are links. */
  hrefFor?: (language: Language) => string;
  /** No pages to move to (the app): the options are buttons. */
  onSelect?: (language: Language) => void;
  /** Sits on a surface that is already glass (the landing's nav): no pill of its own. */
  plain?: boolean;
}

/**
 * The language picker: a globe pill naming the current language ("English ▾")
 * that opens every language in its own name. People scan for theirs, and each
 * option carries `lang`, so a screen reader voices "Português" as Portuguese.
 *
 * On the landing every language has a URL, so the options are links; in the
 * app the choice is saved in the `locale` cookie and the page re-renders in
 * place. The menu is portaled onto the body like ScenarioPicker's: both homes
 * of this pill are glass, and glass traps anything positioned inside it.
 */
export function LanguageMenu({ language, hrefFor, onSelect, plain = false }: Props) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<React.CSSProperties | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const { depth, menuZIndex } = useOverlayLayer();
  const t = (key: "language.label" | "language.current") =>
    translate(UI_MESSAGES, language, key, { language: LANGUAGE_NAMES[language] });

  const close = (refocus: boolean) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    const trigger = triggerRef.current?.getBoundingClientRect();
    const menu = menuRef.current?.getBoundingClientRect();
    if (!trigger || !menu) return;
    // Under the pill, its right edge on the pill's right edge (both homes put
    // the pill at the end of a row), kept inside the viewport on a phone.
    const left = Math.max(
      EDGE,
      Math.min(trigger.right - menu.width, window.innerWidth - menu.width - EDGE)
    );
    // Above the pill when there's no room below (a row near the bottom of a
    // phone): scrolling closes the menu, so a clipped option could never be
    // reached.
    const below = trigger.bottom + GAP;
    const fitsBelow = below + menu.height <= window.innerHeight - EDGE;
    const top = fitsBelow ? below : Math.max(EDGE, trigger.top - GAP - menu.height);
    setPos({ top, left });
  }, [open]);

  useEffect(() => {
    if (!open || !pos) return;
    menuRef.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus();
  }, [open, pos]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    // Fixed coordinates go stale the moment the page moves under them.
    const onMove = () => setOpen(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [open]);

  const onMenuKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Tab") {
      close(true);
      return;
    }
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitemradio"]') ?? []
    );
    const at = items.indexOf(document.activeElement as HTMLElement);
    const to = Math.min(items.length - 1, Math.max(0, at + (e.key === "ArrowDown" ? 1 : -1)));
    items[to]?.focus();
  };

  const option = (target: Language) => {
    const checked = target === language;
    const common = {
      role: "menuitemradio",
      "aria-checked": checked,
      tabIndex: -1,
      lang: target,
      className: `option${checked ? " is-selected" : ""}`,
    } as const;
    const content = (
      <>
        <span className="check" aria-hidden="true">
          {checked && <Check size={14} />}
        </span>
        {LANGUAGE_NAMES[target]}
      </>
    );
    if (hrefFor) {
      return (
        <Link
          key={target}
          {...common}
          href={hrefFor(target)}
          hrefLang={target}
          onClick={() => close(false)}
        >
          {content}
        </Link>
      );
    }
    return (
      <button
        key={target}
        {...common}
        type="button"
        onClick={() => {
          close(true);
          if (!checked) onSelect?.(target);
        }}
      >
        {content}
      </button>
    );
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={plain ? "trigger" : "glass glass--tap trigger"}
        aria-label={t("language.current")}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => (open ? close(false) : setOpen(true))}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        <Globe size={14} />
        <span>{LANGUAGE_NAMES[language]}</span>
        <span className="chevron" aria-hidden="true">
          <ChevronDown size={14} />
        </span>
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            className="glass glass--strong glass--raised language-menu"
            role="menu"
            aria-labelledby={titleId}
            style={{
              ...(pos ?? { top: 0, left: 0, visibility: "hidden" }),
              ...(depth > 0 ? { zIndex: menuZIndex } : null),
            }}
            onKeyDown={onMenuKey}
          >
            <p id={titleId} className="title">
              {t("language.label")}
            </p>
            {LOCALES.map(option)}
          </div>,
          document.body
        )}

      <style jsx>{`
        .trigger {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-height: 36px;
          padding: 0 10px 0 14px;
          border-radius: var(--r-pill);
          color: var(--fg-0);
          font: inherit;
          font-size: 0.85rem;
          font-weight: 600;
          white-space: nowrap;
          cursor: pointer;
        }
        .chevron {
          display: inline-flex;
          color: var(--fg-2);
        }
        .trigger:not(.glass) {
          background: transparent;
          border: none;
          color: var(--fg-1);
        }
        .trigger:not(.glass):hover {
          color: var(--fg-0);
        }
        .trigger:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }

        .language-menu {
          position: fixed;
          z-index: var(--z-menu, 150);
          width: max-content;
          min-width: 160px;
          border-radius: var(--r-lg);
          padding: 4px;
          display: flex;
          flex-direction: column;
          /* Opens over big headings: the glass alone lets them read through. */
          background: var(--bg-1);
        }
        .title {
          margin: 0;
          padding: 8px 12px 4px;
          font-size: 0.75rem;
          color: var(--fg-2);
        }
        .language-menu :global(.option) {
          display: flex;
          align-items: center;
          gap: 8px;
          min-height: 40px;
          padding: 0 14px 0 8px;
          border: none;
          background: transparent;
          color: var(--fg-1);
          font-family: inherit;
          font-size: 0.9rem;
          text-align: left;
          text-decoration: none;
          border-radius: var(--r-sm);
          cursor: pointer;
          white-space: nowrap;
        }
        .language-menu :global(.option:hover),
        .language-menu :global(.option:focus-visible) {
          outline: none;
          background: var(--glass-hover);
          color: var(--fg-0);
        }
        .language-menu :global(.option.is-selected) {
          color: var(--fg-0);
          font-weight: 600;
        }
        .check {
          display: inline-flex;
          width: 14px;
          color: var(--accent);
        }
      `}</style>
    </>
  );
}

/** The app's picker: the current interface language, saved per device on pick. */
export function LanguagePreference() {
  const { language } = usePreferences();
  const setLanguage = useSetLanguage();
  return <LanguageMenu language={language} onSelect={setLanguage} />;
}
