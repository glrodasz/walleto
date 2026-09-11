import { Badge } from "./Badge";
import type { BadgeTone } from "./Badge";
import { buildInfo } from "../../helpers/buildInfo";
import type { BuildEnv } from "../../helpers/buildInfo";

const TONE: Record<BuildEnv, BadgeTone> = {
  production: "info",
  preview: "warning",
  development: "neutral",
};

/**
 * Which build you are looking at, next to the logo. A preview is the only one
 * with a commit to name: the pill itself links to it and names it on hover, so
 * the sidebar never grows a second piece of text.
 */
export function BuildBadge() {
  const { env, label, shortSha, commitUrl } = buildInfo();
  const badge = (
    <Badge variant="outline" tone={TONE[env]} caps>
      {label}
    </Badge>
  );

  if (!commitUrl || !shortSha) return badge;

  return (
    <a
      className="commit"
      href={commitUrl}
      target="_blank"
      rel="noopener noreferrer"
      title={`${shortSha} — view commit on GitHub`}
      aria-label={`Staging build ${shortSha} — view commit on GitHub`}
    >
      {badge}
      <style jsx>{`
        .commit {
          display: inline-flex;
          text-decoration: none;
          border-radius: 999px;
        }

        .commit:hover {
          opacity: 0.75;
        }

        .commit:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }
      `}</style>
    </a>
  );
}
