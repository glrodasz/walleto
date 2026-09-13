import type { Tag } from "../../types";
import { monthsAgo, ts, STORY_USER_ID } from "./time";

const tag = (id: string, name: string): Tag => ({
  id,
  userId: STORY_USER_ID,
  name,
  key: name.toLowerCase(),
  createdAt: ts(monthsAgo(6)),
});

export const STORY_TAGS: Tag[] = [
  tag("tag-family", "Family"),
  tag("tag-work", "Work"),
  tag("tag-trip", "Trip2026"),
  tag("tag-shared", "Shared"),
];
