import { splitEmphasis } from "../../../utils/emphasis";

/**
 * Intro copy with its `**…**` key phrases in bold, so it reads at a glance.
 * A component (not a helper) so the bold keeps this file's styles.
 */
export function Emphasized({ text }: { text: string }) {
  return (
    <>
      {splitEmphasis(text).map((part, n) =>
        part.strong ? (
          <strong key={n} className="key">
            {part.text}
          </strong>
        ) : (
          part.text
        )
      )}
      <style jsx>{`
        .key {
          font-weight: 650;
          color: var(--fg-0);
        }
      `}</style>
    </>
  );
}
