/** An error whose message is written for the person using the app, not for a log. */
export class UserFacingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserFacingError";
  }
}

/**
 * What to show for a failed save. A `UserFacingError` speaks for itself; an
 * API route that answered `{ error: "…" }` (a 409 duplicate, a missing FK)
 * already wrote a sentence, so it's shown as is. Anything else — a network
 * failure, a Zod `flatten()` body, a 500 — falls back to the caller's copy.
 */
export function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof UserFacingError) return err.message;
  if (!(err instanceof Error)) return fallback;
  try {
    const body = JSON.parse(err.message) as { error?: unknown };
    return typeof body?.error === "string" && body.error.trim() ? body.error : fallback;
  } catch {
    return fallback;
  }
}
