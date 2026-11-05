import type { ExpenseDraft } from "../../types";

/** Three drafts: everything known, a yearly one with a date, and just a name. */
export const STORY_DRAFTS: ExpenseDraft[] = [
  {
    id: "draft-spotify",
    name: "Spotify Duo",
    amount: 14.99,
    currency: "USD",
    frequency: "MONTHLY",
    dayOfMonth: 14,
    createdAt: "2026-11-02T10:00:00.000Z",
  },
  {
    id: "draft-domain",
    name: "Domain renewal",
    amount: 18,
    currency: "USD",
    frequency: "YEARLY",
    date: "2027-02-03",
    createdAt: "2026-11-03T10:00:00.000Z",
  },
  { id: "draft-gym", name: "New gym", createdAt: "2026-11-04T10:00:00.000Z" },
];
