import { Eye, EyeOff } from "../atoms/Icons";
import { usePrivacy } from "../../hooks/usePrivacy";

/**
 * The header's privacy switch. It masks every amount in the app without
 * changing anything the app computes: charts, shares and orderings still come
 * from the real numbers, so the picture stays true while the figures don't
 * read from across the room.
 */
export function PrivacyToggle() {
  const { hidden, toggle } = usePrivacy();
  const label = hidden ? "Show amounts" : "Hide amounts";

  return (
    <button
      type="button"
      className={`glass glass--tap toggle${hidden ? " is-on" : ""}`}
      onClick={toggle}
      aria-pressed={hidden}
      aria-label={label}
      title={label}
    >
      {hidden ? <EyeOff size={18} /> : <Eye size={18} />}

      <style jsx>{`
        .toggle {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          flex-shrink: 0;
          border-radius: var(--r-md);
          color: var(--fg-1);
          cursor: pointer;
        }

        /* On is a state worth seeing at a glance: the amounts are missing on
           purpose, not still loading. */
        .toggle.is-on {
          color: var(--accent);
          box-shadow: 0 0 0 1px var(--accent-soft);
        }
      `}</style>
    </button>
  );
}
