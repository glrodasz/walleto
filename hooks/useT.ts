import { useMemo } from "react";
import { translator } from "../helpers/i18n";
import type { Message, Messages, Translator } from "../helpers/i18n";
import { usePreferences } from "./usePreferences";

/**
 * One area's catalog bound to the user's language:
 *
 *   const t = useT(DASHBOARD_MESSAGES);
 *   t("hero.title");                  // "Your plan" · "Tu plan"
 *   t("runway.months", { count: 3 }); // "3 months" · "3 meses"
 */
export function useT<E extends Record<string, Message>>(messages: Messages<E>): Translator<E> {
  const { language } = usePreferences();
  return useMemo(() => translator(messages, language), [messages, language]);
}
