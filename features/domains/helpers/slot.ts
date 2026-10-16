/**
 * A sentence with one piece rendered apart (bold, its own span): translate
 * with `SLOT` in place of that piece, then split around it.
 *
 *   const [before, after] = splitSlot(t("plan.runRate.EXPENSE", { amount: SLOT }));
 *   <>{before}<strong>{amount}</strong>{after}</>
 */
export const SLOT = "\u0000";

export function splitSlot(text: string): [string, string] {
  const at = text.indexOf(SLOT);
  if (at === -1) return [text, ""];
  return [text.slice(0, at), text.slice(at + SLOT.length)];
}
