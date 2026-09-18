import { convert } from "../../../helpers/fx";
import type { MoneyContext } from "../../../helpers/aggregations";
import { monthKey } from "../../../helpers/dates";
import { selectorKey, valuationSelector, withDomain } from "./valuation";
import type { AccountDomain, Category, Currency, InvestmentValuation } from "../../../types";

/**
 * What one value check added in the month it lands in: the gain it reports
 * since the previous check of the same account / bucket.
 */
export interface GainRow {
  id?: string;
  /** `acc:<id>` or `dom:<DOMAIN>` — the chain this check belongs to. */
  selector: string;
  at: Date;
  /** Converted into the reporting currency; negative when the position lost ground. */
  gain: number;
  /** The check's own currency, so the caller can flag "≈". */
  currency: Currency;
}

/** The net gain a check states, converted: what it is worth minus what went in. */
function netGain(v: InvestmentValuation, ctx: MoneyContext): number {
  return (
    convert(v.value, v.currency, ctx.target, ctx.rates) -
    convert(v.costBasis, v.currency, ctx.target, ctx.rates)
  );
}

/** Oldest first; two checks on the same day settle deterministically. */
function byAsOfAsc(a: InvestmentValuation, b: InvestmentValuation): number {
  const at = a.asOf.toDate().getTime() - b.asOf.toDate().getTime();
  if (at !== 0) return at;
  const created = (a.createdAt?.toDate().getTime() ?? 0) - (b.createdAt?.toDate().getTime() ?? 0);
  if (created !== 0) return created;
  return (a.id ?? "").localeCompare(b.id ?? "");
}

/**
 * Every value check of `domain`, oldest first, each carrying the gain it
 * reported since the previous check of the same account / bucket.
 *
 * Because every check snapshots its own `costBasis`, this needs no transaction
 * history at all: the chain telescopes, so the gains of one selector add up to
 * `value − costBasis` of its last check. And since the modal writes that basis
 * as the contributions to date, `contributions + Σ gains` is what the position
 * is worth — the identity the page's totals rest on.
 *
 * Value and basis are converted separately before subtracting, so a chain whose
 * checks were recorded in different currencies still telescopes. Rows written
 * before accounts existed carry no `domain`; `withDomain` resolves theirs
 * through their category first, so they chain in the right place.
 */
export function valuationGainRows(
  valuations: InvestmentValuation[],
  domain: AccountDomain,
  categories: Pick<Category, "id" | "domain">[],
  ctx: MoneyContext
): GainRow[] {
  const mine = withDomain(valuations, categories)
    .filter((v) => v.domain === domain)
    .sort(byAsOfAsc);

  // The net gain the previous check of each chain reported; 0 before the first.
  const previous = new Map<string, number>();
  return mine.map((v) => {
    const selector = selectorKey(valuationSelector(v, categories));
    const net = netGain(v, ctx);
    const gain = net - (previous.get(selector) ?? 0);
    previous.set(selector, net);
    return { id: v.id, selector, at: v.asOf.toDate(), gain, currency: v.currency };
  });
}

/**
 * The gain each month window earned, keyed like `monthTotals`: every window
 * key present, 0 where no check landed. Checks outside the windows still
 * anchor their chain — they simply add to no bar.
 */
export function monthGains(
  valuations: InvestmentValuation[],
  domain: AccountDomain,
  categories: Pick<Category, "id" | "domain">[],
  ctx: MoneyContext,
  windows: { key: string }[]
): Record<string, number> {
  const gains: Record<string, number> = {};
  for (const w of windows) gains[w.key] = 0;
  for (const row of valuationGainRows(valuations, domain, categories, ctx)) {
    const key = monthKey(row.at);
    if (key in gains) gains[key] += row.gain;
  }
  return gains;
}
