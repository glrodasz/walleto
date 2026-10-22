import type { Language } from "../../../types";

/**
 * The landing's screenshots, in public/landing/<language>/<id>.webp: the
 * Storybook stories (demo data, light theme) captured at 2× and saved as
 * WebP. Regenerate them when the screens they show change.
 */
export type ShotId =
  | "hero"
  | "hero-mobile"
  | "plan"
  | "checklist"
  | "variable"
  | "currency"
  | "worth"
  | "prospect";

/** Both languages share a size: the same screen, captured at the same width. */
export const LANDING_SHOTS: Record<ShotId, { width: number; height: number }> = {
  hero: { width: 1600, height: 1000 },
  "hero-mobile": { width: 520, height: 1040 },
  plan: { width: 1200, height: 397 },
  checklist: { width: 1200, height: 761 },
  variable: { width: 1200, height: 884 },
  currency: { width: 1200, height: 797 },
  worth: { width: 1200, height: 375 },
  prospect: { width: 1200, height: 860 },
};

export function shotSrc(id: ShotId, language: Language): string {
  return `/landing/${language}/${id}.webp`;
}

/** The social preview (Open Graph / Twitter), a 1200×630 crop of the hero. */
export function ogImageSrc(language: Language): string {
  return `/landing/${language}/og.png`;
}
