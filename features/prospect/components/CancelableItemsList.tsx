import { Card } from "../../../components/atoms/Card";
import { Chip } from "../../../components/atoms/Chip";
import { SectionTitle } from "../../../components/atoms/SectionTitle";
import { useMoneyFormat } from "../../../hooks/useMoneyFormat";
import { useT } from "../../../hooks/useT";
import { COMMON_MESSAGES } from "../../../messages/common";
import { PROSPECT_MESSAGES } from "../messages";
import { topNonEssentialIds } from "../helpers/rankCancelable";
import type { CancelableGroups } from "../helpers/rankCancelable";
import { CancelableSection } from "./CancelableSection";
import type { ProspectMode } from "./ProspectModeToggle";
import type { Category, Currency, RecurrentTransaction } from "../../../types";

interface Props {
  groups: CancelableGroups;
  mode: ProspectMode;
  /** What-if mode: the items being simulated as cancelled. */
  excludedIds: ReadonlySet<string>;
  onToggle: (id: string) => void;
  onSelect: (ids: string[]) => void;
  /** Flip an expense's essential flag (persisted on the item). */
  onMarkEssential: (item: RecurrentTransaction, essential: boolean) => void;
  categories: Pick<Category, "id" | "name">[];
  currency: Currency;
  loading: boolean;
}

const TOP_N = [1, 2, 3];

/**
 * The plan's outgoing items, grouped by what could go. In what-if mode each
 * row is a checkbox ("simulate cancelling this") and the chips pick the
 * priciest non-essential items in one tap; in emergency mode the checks show
 * what the mode pauses and can't be changed — the essential flag decides.
 */
export function CancelableItemsList({
  groups,
  mode,
  excludedIds,
  onToggle,
  onSelect,
  onMarkEssential,
  categories,
  currency,
  loading,
}: Props) {
  const { formatAmount } = useMoneyFormat();
  const t = useT(PROSPECT_MESSAGES);
  const tc = useT(COMMON_MESSAGES);
  const emergency = mode === "emergency";
  const empty =
    groups.nonEssential.length +
      groups.essential.length +
      groups.contributions.length +
      groups.debts.length ===
    0;

  const freedBy = (n: number) =>
    groups.nonEssential.slice(0, n).reduce((acc, r) => acc + r.monthly, 0);
  const topOptions = TOP_N.filter((n) => n <= groups.nonEssential.length);
  const isTop = (n: number) => {
    const ids = topNonEssentialIds(groups, n);
    return ids.length === excludedIds.size && ids.every((id) => excludedIds.has(id));
  };

  const shared = { currency, categories, onMarkEssential };

  return (
    <Card>
      <SectionTitle title={emergency ? t("list.title.emergency") : t("list.title.whatif")} />
      <p className="hint">{emergency ? t("list.hint.emergency") : t("list.hint.whatif")}</p>

      {!emergency && topOptions.length > 0 && (
        <div className="chips" role="group" aria-label={t("list.quickPicks")}>
          {topOptions.map((n) => (
            <Chip
              key={n}
              selected={isTop(n)}
              onClick={() => onSelect(topNonEssentialIds(groups, n))}
            >
              {t("list.cancelTop", { count: n, amount: formatAmount(freedBy(n), currency) })}
            </Chip>
          ))}
          {excludedIds.size > 0 && <Chip onClick={() => onSelect([])}>{tc("action.clear")}</Chip>}
        </div>
      )}

      {loading ? (
        <p className="empty">{tc("state.loading")}</p>
      ) : empty ? (
        <p className="empty">{t("list.empty")}</p>
      ) : (
        <div className="sections">
          <CancelableSection
            title={t("group.nonEssential")}
            rows={groups.nonEssential}
            emptyText={t("group.nonEssential.empty")}
            isChecked={(id) => (emergency ? true : excludedIds.has(id))}
            onToggle={emergency ? undefined : onToggle}
            {...shared}
          />
          <CancelableSection
            title={t("group.essential")}
            rows={groups.essential}
            isChecked={(id) => !emergency && excludedIds.has(id)}
            onToggle={emergency ? undefined : onToggle}
            {...shared}
          />
          <CancelableSection
            title={t("group.contributions")}
            rows={groups.contributions}
            isChecked={(id) => (emergency ? true : excludedIds.has(id))}
            onToggle={emergency ? undefined : onToggle}
            {...shared}
          />
          <CancelableSection
            title={t("group.debts")}
            rows={groups.debts}
            isChecked={(id) => !emergency && excludedIds.has(id)}
            onToggle={emergency ? undefined : onToggle}
            {...shared}
          />
        </div>
      )}

      <style jsx>{`
        .hint {
          margin: 0 0 14px;
          font-size: 0.85rem;
          color: var(--fg-1);
          line-height: 1.45;
        }

        .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 14px;
        }

        .empty {
          margin: 0;
          font-size: 0.85rem;
          color: var(--fg-2);
        }

        .sections {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
      `}</style>
    </Card>
  );
}
