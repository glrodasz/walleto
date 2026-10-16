import { LABEL_MESSAGES } from "../messages/labels";
import { translate } from "./i18n";
import type { Language } from "../types";

/** "Good morning" until noon, "Good afternoon" until six, "Good evening" after. */
export function greeting(now: Date = new Date(), language: Language = "en"): string {
  const hour = now.getHours();
  const key =
    hour < 5
      ? "greeting.evening"
      : hour < 12
        ? "greeting.morning"
        : hour < 18
          ? "greeting.afternoon"
          : "greeting.evening";
  return translate(LABEL_MESSAGES, language, key);
}
