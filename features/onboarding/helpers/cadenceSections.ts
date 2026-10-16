import { translate } from "../../../helpers/i18n";
import type { Domain, Frequency, Language } from "../../../types";
import { ONBOARDING_MESSAGES } from "../messages";

export type CadenceSectionId = "monthly" | "yearly" | "other" | "oneTime";

export interface CadenceSection {
  id: CadenceSectionId;
  /** Which frequencies land in this section. */
  frequencies: readonly Frequency[];
  /** The frequency a row added from this section starts with. */
  defaultFrequency: Frequency;
  /** Whether backfilling history applies — one-time items have a date instead. */
  recurring: boolean;
  /**
   * The section most of a plan lives in: drawn larger and first, while the
   * others sit apart under "Less often" so an add aimed at it can't land in one.
   */
  primary: boolean;
}

/**
 * The wizard groups rows by cadence instead of a per-row frequency dropdown:
 * the shape of the form says "we care about what repeats" before any copy
 * does, and each group can offer exactly the date control it needs.
 */
export const CADENCE_SECTIONS: readonly CadenceSection[] = [
  {
    id: "monthly",
    frequencies: ["MONTHLY"],
    defaultFrequency: "MONTHLY",
    recurring: true,
    primary: true,
  },
  {
    id: "yearly",
    frequencies: ["YEARLY"],
    defaultFrequency: "YEARLY",
    recurring: true,
    primary: false,
  },
  {
    id: "other",
    frequencies: ["WEEKLY", "BIWEEKLY", "QUARTERLY"],
    defaultFrequency: "QUARTERLY",
    recurring: true,
    primary: false,
  },
  {
    id: "oneTime",
    frequencies: ["ONE_TIME"],
    defaultFrequency: "ONE_TIME",
    recurring: false,
    primary: false,
  },
];

export function sectionFor(frequency: Frequency): CadenceSection {
  const section = CADENCE_SECTIONS.find((s) => s.frequencies.includes(frequency));
  // Every Frequency is listed above; this is only for the type system.
  return section ?? CADENCE_SECTIONS[2];
}

export const cadenceTitle = (id: CadenceSectionId, language: Language = "en") =>
  translate(ONBOARDING_MESSAGES, language, `cadence.${id}.title`);

export const cadenceHint = (id: CadenceSectionId, language: Language = "en") =>
  translate(ONBOARDING_MESSAGES, language, `cadence.${id}.hint`);

/**
 * The add chip's label, naming the cadence and what it adds: "Add a monthly
 * expense", "Add another yearly income". One sentence per combination, so
 * Spanish keeps its own word order and gender.
 */
export function cadenceAddLabel(
  id: CadenceSectionId,
  domain: Domain,
  more: boolean,
  language: Language = "en"
): string {
  const kind = domain === "INCOME" || domain === "EXPENSE" ? domain : "OTHER";
  return translate(ONBOARDING_MESSAGES, language, `add.${id}.${kind}.${more ? "more" : "first"}`);
}
