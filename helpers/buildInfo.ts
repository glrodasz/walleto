import { GITHUB_REPO_URL } from "../constants";

/** The three places the app runs: Vercel production, Vercel previews, and a laptop. */
export type BuildEnv = "production" | "preview" | "development";

export interface BuildInfo {
  env: BuildEnv;
  /** What the badge next to the logo says. */
  label: string;
  /** The seven-character commit, on previews only — there is no commit to name locally. */
  shortSha: string | null;
  /** Where that commit lives on GitHub, on previews only. */
  commitUrl: string | null;
}

const LABEL: Record<BuildEnv, string> = {
  production: "Alpha",
  preview: "Staging",
  development: "Dev",
};

/**
 * Which build the reader is looking at. Both values are inlined at build time
 * by `next.config.js` from Vercel's system env vars; anything unset or
 * unrecognised is a local build, so the badge never claims to be production.
 */
export function buildInfo(
  env: string | undefined = process.env.NEXT_PUBLIC_APP_ENV,
  sha: string | undefined = process.env.NEXT_PUBLIC_COMMIT_SHA
): BuildInfo {
  const resolved: BuildEnv = env === "production" || env === "preview" ? env : "development";
  const commit = resolved === "preview" ? (sha?.trim() ?? "") : "";
  return {
    env: resolved,
    label: LABEL[resolved],
    shortSha: commit ? commit.slice(0, 7) : null,
    commitUrl: commit ? `${GITHUB_REPO_URL}/commit/${commit}` : null,
  };
}
