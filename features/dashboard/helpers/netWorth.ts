/** One account domain's position today, as `useDomainValue` reports it. */
export interface PositionPart {
  /** Worth (investments, savings) or still owed (debts), converted and positive. */
  value: number;
  /** Whether the domain has any account, pocket or unfiled position at all. */
  hasRows: boolean;
  /** When the newest value / balance check was recorded; null when none was. */
  lastCheckedAt: Date | null;
  /** No check, but a quoted rate: the value is compounded, not stated. */
  estimated: boolean;
}

export interface NetWorth {
  investments: number;
  savings: number;
  /** Still owed; 0 when no balance has been recorded. */
  debts: number;
  /** investments + savings − debts. */
  net: number;
  /** A debt exists but no balance was ever recorded, so it is not counted. */
  debtsUnknown: boolean;
  /** Some asset figure is an interest estimate rather than a stated value. */
  estimated: boolean;
  /** Nothing to value yet: no accounts, pockets, debts or positions. */
  empty: boolean;
  /** The newest check across the three domains. */
  lastCheckedAt: Date | null;
}

/**
 * Where the owner stands today: what the investment accounts and savings
 * pockets are worth, minus what the debts still owe. A debt without a
 * recorded balance has no known figure — it is left out and flagged, never
 * guessed.
 */
export function netWorth(parts: {
  investments: PositionPart;
  savings: PositionPart;
  debts: PositionPart;
}): NetWorth {
  const { investments, savings, debts } = parts;
  const debtsKnown = Boolean(debts.lastCheckedAt);
  const owed = debtsKnown ? debts.value : 0;
  const lastCheckedAt =
    [investments, savings, debts]
      .map((p) => p.lastCheckedAt)
      .filter((d): d is Date => d !== null)
      .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;

  return {
    investments: investments.value,
    savings: savings.value,
    debts: owed,
    net: investments.value + savings.value - owed,
    debtsUnknown: debts.hasRows && !debtsKnown,
    estimated: investments.estimated || savings.estimated,
    empty: !investments.hasRows && !savings.hasRows && !debts.hasRows,
    lastCheckedAt,
  };
}
