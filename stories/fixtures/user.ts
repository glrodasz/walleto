import type { UserProfile } from "@auth0/nextjs-auth0/client";
import type { UserDoc } from "../../hooks/useUserDoc";
import { STORY_USER_ID } from "./time";

/** What Auth0's `useUser()` reports inside Storybook. */
export const STORY_USER: UserProfile = {
  sub: STORY_USER_ID,
  name: "Ada Lovelace",
  nickname: "ada",
  email: "ada@example.com",
  email_verified: true,
};

/** The Firestore user doc: onboarded, reporting in USD, light theme. */
export const STORY_USER_DOC: UserDoc = {
  mainCurrency: "USD",
  displayCurrency: "USD",
  onboardingCompleted: true,
  onboardingMode: "ASSISTED",
  theme: "light",
  dateFormat: "MDY",
  weekStart: 1,
  language: "en",
};
