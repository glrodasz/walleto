export interface EmphasisPart {
  text: string;
  strong: boolean;
}

/**
 * Splits text on `**` markers into plain and emphasised runs:
 * "a **b** c" → [a ][b*][ c]. An unmatched trailing `**` is dropped and its
 * text stays plain, so a typo never leaks markers onto the screen.
 */
export function splitEmphasis(text: string): EmphasisPart[] {
  const chunks = text.split("**");
  // An even number of chunks means one `**` was left open: its run isn't bold.
  const closed = chunks.length % 2 === 1 ? chunks.length : chunks.length - 1;

  const parts: EmphasisPart[] = [];
  chunks.forEach((chunk, n) => {
    if (!chunk) return;
    const strong = n % 2 === 1 && n < closed;
    const last = parts[parts.length - 1];
    if (last && last.strong === strong) last.text += chunk;
    else parts.push({ text: chunk, strong });
  });
  return parts;
}
