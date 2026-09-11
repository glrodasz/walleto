import { useEffect, useId, useMemo, useRef, useState } from "react";

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
  // on blur, which made stray categories far too easy to produce.
  useEffect(() => {
    if (!onCancel) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) onCancel();
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [onCancel]);

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

      {showList && (
        <ul className="list" id={listId} role="listbox" aria-label={label}>
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
        </ul>
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
          border-radius: 999px;
          border: 1px solid var(--accent);
          background: var(--bg-2);
          color: var(--fg-0);
          font-family: inherit;
          font-size: 16px;
        }

        .combobox.full-width .input {
          height: 40px;
          border-radius: var(--r-md);
          border-color: var(--line);
        }

        .combobox .input:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: none;
        }

        .combobox .input::placeholder {
          color: var(--fg-2);
        }

        .combobox .input:disabled {
          opacity: 0.5;
        }

        .list {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          z-index: 20;
          margin: 0;
          padding: 4px;
          list-style: none;
          width: 240px;
          max-height: 220px;
          overflow-y: auto;
          background: var(--bg-2);
          border: 1px solid var(--line-strong);
          border-radius: var(--r-md);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
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
          background: var(--bg-3);
          color: var(--fg-0);
        }
      `}</style>
    </div>
  );
}
