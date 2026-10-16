import { TabStrip } from "../../../components/atoms/TabStrip";
import { useT } from "../../../hooks/useT";
import { COMMON_MESSAGES } from "../../../messages/common";
import { DOMAIN_MESSAGES } from "../messages";

export type DomainView = "plan" | "activity" | "categories" | "tags" | "methods" | "value";

/** The view a bare URL opens on: the plan, not the ledger. */
export const DEFAULT_DOMAIN_VIEW: DomainView = "plan";

interface Props {
  value: DomainView;
  onChange: (view: DomainView) => void;
  accent: string;
  /** Investments, savings and debts add a view: what each account is worth (or owes). */
  showValue?: boolean;
  /** What that view is called — "Worth", or "Owed" on debts. */
  valueLabel?: string;
  /** Domains without payment methods (income, accounts) skip that view. */
  showMethods?: boolean;
}

type NounKey =
  | "noun.plan"
  | "noun.activity"
  | "noun.categories"
  | "noun.tags"
  | "noun.paymentMethods"
  | "noun.worth";

const VIEWS: { key: DomainView; label: NounKey }[] = [
  { key: "plan", label: "noun.plan" },
  { key: "activity", label: "noun.activity" },
  { key: "categories", label: "noun.categories" },
  { key: "tags", label: "noun.tags" },
  { key: "methods", label: "noun.paymentMethods" },
  { key: "value", label: "noun.worth" },
];

/** Hashes from before the views were renamed, so old links still land. */
const LEGACY: Record<string, DomainView> = { recurring: "plan", transactions: "activity" };

/** The view a URL hash names, or null when it names none. */
export const parseDomainView = (s: string): DomainView | null =>
  VIEWS.find((v) => v.key === s)?.key ?? LEGACY[s] ?? null;

/** The same month, sliced six ways: the plan, the ledger, and grouped by category, tag, method or account. */
export function ViewTabs({
  value,
  onChange,
  accent,
  showValue,
  valueLabel,
  showMethods = true,
}: Props) {
  const common = useT(COMMON_MESSAGES);
  const t = useT(DOMAIN_MESSAGES);
  const views = VIEWS.filter(
    (v) => (v.key !== "value" || showValue) && (v.key !== "methods" || showMethods)
  ).map((v) => ({
    key: v.key,
    label: v.key === "value" && valueLabel ? valueLabel : common(v.label),
  }));
  return (
    <TabStrip
      label={t("view.label")}
      tabs={views}
      value={value}
      accent={accent}
      onChange={(key) => onChange(key as DomainView)}
    />
  );
}
