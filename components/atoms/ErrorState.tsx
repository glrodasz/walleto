interface Props {
  title?: string;
  description?: string;
  /** The failure itself. Its message is shown verbatim — see below. */
  error?: Error | null;
}

/** Firestore's index errors carry the console URL that creates the index. */
const CONSOLE_URL = /https:\/\/console\.firebase\.google\.com\/\S+/;

export function extractConsoleUrl(message: string): string | null {
  return message.match(CONSOLE_URL)?.[0].replace(/[.,)]+$/, "") ?? null;
}

/**
 * Distinct from EmptyState on purpose: a broken rule or a building index must
 * read as "something failed", never as "No data yet".
 *
 * The raw message is shown rather than swallowed. Firestore's most common
 * failure here — a missing composite index — names the exact problem and
 * includes a one-click console link to fix it, and hiding that behind friendly
 * copy is how an undeployed index turns into a silent empty dashboard.
 */
export function ErrorState({
  title = "Couldn't load this data",
  description = "Something went wrong on our side. Try reloading the page.",
  error,
}: Props) {
  const consoleUrl = error?.message ? extractConsoleUrl(error.message) : null;

  return (
    <div className="error-state" role="alert">
      <span className="icon" aria-hidden="true">
        ⚠
      </span>
      <span className="title">{title}</span>
      <span className="desc">{description}</span>

      {error?.message && <code className="detail">{error.message}</code>}

      {consoleUrl && (
        <a className="fix" href={consoleUrl} target="_blank" rel="noreferrer">
          Create the missing index →
        </a>
      )}

      <style jsx>{`
        .error-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          text-align: center;
          padding: 32px 24px;
          border: 1px solid var(--accent-hot);
          border-radius: var(--r-md);
          background: rgba(255, 61, 104, 0.08);
        }

        .icon {
          font-size: 1.2rem;
          color: var(--accent-hot);
        }

        .title {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--fg-0);
        }

        .desc {
          font-size: 0.85rem;
          color: var(--fg-2);
          max-width: 360px;
        }

        .detail {
          margin-top: 8px;
          max-width: 100%;
          max-height: 88px;
          overflow: auto;
          padding: 8px 12px;
          border-radius: var(--r-sm);
          background: var(--bg-0);
          border: 1px solid var(--line);
          font-family: var(--font-mono, "JetBrains Mono", ui-monospace, monospace);
          font-size: 0.72rem;
          line-height: 1.5;
          color: var(--fg-1);
          text-align: left;
          word-break: break-word;
        }

        .fix {
          margin-top: 4px;
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--accent);
          text-decoration: none;
        }

        .fix:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
