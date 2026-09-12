import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface Props {
  /** Names to suggest. Anything already used should be filtered out by the caller. */
  suggestions: string[];
  onSelect: (value: string) => void;
  onCancel?: () => void;
  placeholder?: string;
  label: string;
  autoFocus?: boolean;
  disabled?: boolean;
  /**
   * Controlled mode: the field mirrors this value instead of managing its own
   * draft, and never clears itself after a commit — every keystroke and every
   * pick both just call `onSelect` with the new text. Use this to embed the
   * combobox as a normal persistent form field (e.g. a card network picker)
   * rather than the default one-shot "type or create, then reset" affordance.
   */
  value?: string;
  /** Visible label above the field, like TextField/Select. Only meaningful — and
   * only rendered — in controlled mode; the uncontrolled "add" usage relies on
   * surrounding context (a chip, a section heading) instead. */
  fieldLabel?: string;
}

/**
 * Text input with a filtered suggestion list. When the typed text matches no
 * suggestion, a "Create ..." row is offered so the user is never blocked by the
 * preset list.
 */
export function Combobox({
  suggestions,
  onSelect,
  onCancel,
  placeholder = "Search or create",
  label,
  autoFocus,
  disabled,
  value,
  fieldLabel,
}: Props) {
  const isControlled = value !== undefined;
  const [internalDraft, setInternalDraft] = useState("");
  const draft = isControlled ? value : internalDraft;
  const [highlight, setHighlight] = useState(0);
  // Only the controlled (persistent field) usage needs real open/close state —
  // the uncontrolled "add" usage is mounted only while actively adding, so it
  // has always shown its options immediately, and changing that would break
  // existing callers and their tests.
  const [focused, setFocused] = useState(false);
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  // Null until measured; the list renders hidden for that one frame so it
  // never flashes at the wrong place.
  const [pos, setPos] = useState<React.CSSProperties | null>(null);

  const trimmed = draft.trim();

  const matches = useMemo(() => {
    if (!trimmed) return suggestions;
    const needle = trimmed.toLowerCase();
    return suggestions.filter((s) => s.toLowerCase().includes(needle));
  }, [suggestions, trimmed]);

  // Offer creation unless the text exactly matches something already listed.
  const canCreate =
    trimmed.length > 0 && !suggestions.some((s) => s.toLowerCase() === trimmed.toLowerCase());

  const options = useMemo(
    () => [...matches, ...(canCreate ? [trimmed] : [])],
    [matches, canCreate, trimmed]
  );
  const createIndex = canCreate ? options.length - 1 : -1;
  const showList = (isControlled ? focused : true) && options.length > 0 && !disabled;

  useEffect(() => {
    setHighlight(0);
  }, [trimmed]);

  // Clicking outside is a cancel, not a create — the old inline input committed
  // on blur, which made stray categories far too easy to produce. The list is
  // portaled onto document.body (see below), so its own DOM sits outside
  // rootRef and needs its own containment check.
  useEffect(() => {
    if (!onCancel) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (listRef.current?.contains(target)) return;
      onCancel();
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [onCancel]);

  // Every Card wears `.glass`, and `backdrop-filter` makes it both a stacking
  // context and a containing block — so a list positioned inside one can
  // never be ranked against a later card, the FAB or the mobile nav, whatever
  // its z-index (see KebabMenu). The only way out is to render it somewhere
  // else: the list lives on `document.body`, positioned against the input's
  // viewport rect.
  useEffect(() => {
    if (!showList) {
      setPos(null);
      return;
    }
    const update = () => {
      const rect = inputRef.current?.getBoundingClientRect();
      if (!rect) return;
      // At least as wide as the input, but never narrower than the old fixed
      // list width — a compact combobox shouldn't truncate its own suggestions.
      setPos({ top: rect.bottom + 6, left: rect.left, width: Math.max(rect.width, 240) });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [showList]);

  const commit = (index: number) => {
    const picked = options[index];
    if (!picked) return;
    onSelect(picked);
    if (!isControlled) setInternalDraft("");
    setFocused(false);
  };

  return (
    <div className={`combobox${fieldLabel ? " full-width" : ""}`} ref={rootRef}>
      {fieldLabel && (
        <label className="label" htmlFor={listId}>
          {fieldLabel}
        </label>
      )}
      <input
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={autoFocus}
        ref={inputRef}
        id={fieldLabel ? listId : undefined}
        className="input"
        type="text"
        role="combobox"
        disabled={disabled}
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList ? `${listId}-${highlight}` : undefined}
        aria-label={label}
        placeholder={placeholder}
        value={draft}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => {
          const next = e.currentTarget.value;
          setFocused(true);
          if (isControlled) onSelect(next);
          else setInternalDraft(next);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlight((h) => (options.length ? (h + 1) % options.length : 0));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((h) => (options.length ? (h - 1 + options.length) % options.length : 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            commit(highlight);
          } else if (e.key === "Escape") {
            e.preventDefault();
            if (isControlled) {
              setFocused(false);
            } else {
              setInternalDraft("");
              onCancel?.();
            }
          }
        }}
      />

      {showList &&
        typeof document !== "undefined" &&
        createPortal(
          <ul
            ref={listRef}
            className="glass glass--strong glass--raised list"
            id={listId}
            role="listbox"
            aria-label={label}
            style={pos ?? { top: 0, left: 0, visibility: "hidden" }}
          >
            {options.map((option, i) => (
              <li
                key={`${option}-${i}`}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === highlight}
                className={`option${i === highlight ? " highlighted" : ""}`}
                onMouseEnter={() => setHighlight(i)}
                // mousedown fires before the input's blur, so the click isn't lost
                onMouseDown={(e) => {
                  e.preventDefault();
                  commit(i);
                }}
              >
                {i === createIndex ? (
                  <>
                    Create <strong>&ldquo;{option}&rdquo;</strong>
                  </>
                ) : (
                  option
                )}
              </li>
            ))}
          </ul>,
          document.body
        )}

      <style jsx>{`
        .combobox {
          position: relative;
          display: inline-flex;
          flex-direction: column;
          gap: 6px;
          width: 200px;
        }

        .combobox.full-width {
          width: 100%;
        }

        .label {
          font-size: 0.8125rem;
          color: var(--fg-1);
        }

        /* Scoped through .combobox so it beats the blanket input rule in
           globals.css — otherwise the input keeps its own border inside this
           one and renders as a double ring. */
        .combobox .input {
          width: 100%;
          min-width: 0;
          min-height: 34px;
          height: 34px;
          padding: 0 14px;
          border-radius: var(--r-pill);
          border: 1px solid var(--accent);
          background-color: var(--glass-field);
          backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
          -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
          box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.06);
          color: var(--fg-0);
          font-family: inherit;
          font-size: 16px;
        }

        .combobox.full-width .input {
          height: 40px;
          border-radius: var(--r-md);
          border-color: var(--glass-rim);
        }

        .combobox .input:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-soft);
        }

        .combobox .input::placeholder {
          color: var(--fg-2);
        }

        .combobox .input:disabled {
          opacity: 0.5;
        }

        /* Fixed, because it is mounted on the body: the position comes from
           the input's rect (see the positioning effect above). Above the nav
           and the FAB, below a modal — which it can finally honour, now that
           no ancestor's backdrop-filter traps it. */
        .list {
          position: fixed;
          z-index: var(--z-menu, 150);
          margin: 0;
          padding: 4px;
          list-style: none;
          min-width: 200px;
          max-height: 220px;
          overflow-y: auto;
          border-radius: var(--r-lg);
        }

        .option {
          padding: 8px 12px;
          border-radius: var(--r-sm);
          font-size: 0.875rem;
          color: var(--fg-1);
          cursor: pointer;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .option.highlighted {
          background: var(--glass-hover);
          color: var(--fg-0);
        }
      `}</style>
    </div>
  );
}
