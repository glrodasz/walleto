import type { Frequency } from "../../../types";

export type CadenceSectionId = "monthly" | "yearly" | "other" | "oneTime";

export interface CadenceSection {
  id: CadenceSectionId;
  title: string;
  hint: string;
  /** Which frequencies land in this section. */
  frequencies: readonly Frequency[];
  /** The frequency a row added from this section starts with. */
  defaultFrequency: Frequency;
  /** Whether "backfill the last 6 months" applies — one-time items have a date instead. */
  recurring: boolean;
}

/**
 * The wizard groups rows by cadence instead of a per-row frequency dropdown:
 * the shape of the form says "we care about what repeats" before any copy
 * does, and each group can offer exactly the date control it needs.
 */
export const CADENCE_SECTIONS: readonly CadenceSection[] = [
  {
    id: "monthly",
    title: "Recurring monthly",
    hint: "Salary, rent, subscriptions — anything that lands every month.",
    frequencies: ["MONTHLY"],
    defaultFrequency: "MONTHLY",
    recurring: true,
  },
  {
    id: "yearly",
    title: "Recurring yearly",
    hint: "Annual plans, insurance renewals, taxes.",
    frequencies: ["YEARLY"],
    defaultFrequency: "YEARLY",
    recurring: true,
  },
  {
    id: "other",
    title: "Other cadence",
    hint: "Weekly, twice a month or quarterly.",
    frequencies: ["WEEKLY", "BIWEEKLY", "QUARTERLY"],
    defaultFrequency: "QUARTERLY",
    recurring: true,
  },
  {
    id: "oneTime",
    title: "One-time",
    hint: "A single payment on a specific date.",
    frequencies: ["ONE_TIME"],
    defaultFrequency: "ONE_TIME",
    recurring: false,
  },
];

export function sectionFor(frequency: Frequency): CadenceSection {
  const section = CADENCE_SECTIONS.find((s) => s.frequencies.includes(frequency));
  // Every Frequency is listed above; this is only for the type system.
  return section ?? CADENCE_SECTIONS[2];
}
