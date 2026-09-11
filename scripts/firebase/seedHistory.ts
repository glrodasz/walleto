import {
  materializeOccurrences,
  occurrenceToTransaction,
} from "../../helpers/materializeOccurrences";
import { ZERO_DECIMAL_CURRENCIES } from "../../constants";
import type { Currency, RecurrentTransaction } from "../../types";

export interface HistoryDoc {
  /** Deterministic `{itemId}_{YYYY-MM-DD}` — the same id the app's materializer uses. */
  id: string;
  /** Transaction fields; `occurredAt` is a JS Date the caller converts to a Timestamp. */
  data: Record<string, unknown> & { occurredAt: Date };
}

/**
 * Deterministic multiplier in [1-spread, 1+spread], derived from a string key
 * via FNV-1a. Same key always gives the same factor, so re-seeding reproduces
 * byte-identical history instead of reshuffling every chart.
 */
export function jitterFactor(key: string, spread = 0.15): number {
  let hash = 2166136261;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const unit = ((hash >>> 0) % 10000) / 10000; // [0, 1)
  return 1 + (unit * 2 - 1) * spread;
}

/** Rounds to the currency's real precision — COP and JPY have no cents. */
export function roundForCurrency(amount: number, currency: Currency): number {
  return ZERO_DECIMAL_CURRENCIES.has(currency)
    ? Math.round(amount)
    : Math.round(amount * 100) / 100;
}

interface BuildOptions {
  from: Date;
  to: Date;
  /** Item ids whose occurrences get jittered — groceries vary month to month, Netflix doesn't. */
  variableIds?: ReadonlySet<string>;
}

/**
 * Past transactions derived from the recurrent items themselves, through the
 * exact helpers `POST /api/transactions/materialize` uses. Seeding the same
 * deterministic ids is what stops the app's materializer from writing a second
 * copy of every charge the first time the dashboard mounts.
 */
export function buildHistory(items: RecurrentTransaction[], opts: BuildOptions): HistoryDoc[] {
  const docs: HistoryDoc[] = [];

  for (const item of items) {
    if (!item.id || !item.active) continue;
    const jitter = opts.variableIds?.has(item.id) ?? false;

    for (const occurrence of materializeOccurrences(item, opts.from, opts.to)) {
      const factor = jitter ? jitterFactor(occurrence.id) : 1;

      docs.push({
        id: occurrence.id,
        data: {
          ...occurrenceToTransaction(item, occurrence.occurredAt),
          amount: roundForCurrency(item.amount * factor, item.currency),
          ...(item.chargedAmount !== undefined && item.chargedCurrency
            ? {
                chargedAmount: roundForCurrency(item.chargedAmount * factor, item.chargedCurrency),
              }
            : {}),
          occurredAt: occurrence.occurredAt,
        },
      });
    }
  }

  return docs;
}
