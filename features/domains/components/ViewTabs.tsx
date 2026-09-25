import { TabStrip } from "../../../components/atoms/TabStrip";

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

const VIEWS: { key: DomainView; label: string }[] = [
  { key: "plan", label: "Plan" },
  { key: "activity", label: "Activity" },
  { key: "categories", label: "Categories" },
  { key: "tags", label: "Tags" },
  { key: "methods", label: "Payment methods" },
  { key: "value", label: "Worth" },
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
  const views = VIEWS.filter(
    (v) => (v.key !== "value" || showValue) && (v.key !== "methods" || showMethods)
  ).map((v) => (v.key === "value" && valueLabel ? { ...v, label: valueLabel } : v));
  return (
    <TabStrip
      label="View"
      tabs={views}
      value={value}
      accent={accent}
      onChange={(key) => onChange(key as DomainView)}
    />
  );
}
