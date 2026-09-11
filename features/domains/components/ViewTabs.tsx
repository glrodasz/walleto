import { TabStrip } from "../../../components/atoms/TabStrip";

export type DomainView = "transactions" | "recurring" | "categories" | "tags" | "methods" | "value";

interface Props {
  value: DomainView;
  onChange: (view: DomainView) => void;
  accent: string;
  /** Investments and savings add a view: what each account is worth. */
  showValue?: boolean;
  /** Domains without payment methods (income, accounts) skip that view. */
  showMethods?: boolean;
}

const VIEWS: { key: DomainView; label: string }[] = [
  { key: "transactions", label: "Transactions" },
  { key: "recurring", label: "Recurring" },
  { key: "categories", label: "Categories" },
  { key: "tags", label: "Tags" },
  { key: "methods", label: "Payment methods" },
  { key: "value", label: "Value" },
];

export const isDomainView = (s: string): s is DomainView => VIEWS.some((v) => v.key === s);

/** The same month, sliced six ways: raw, the plan, and grouped by category, tag, method or account. */
export function ViewTabs({ value, onChange, accent, showValue, showMethods = true }: Props) {
  const views = VIEWS.filter(
    (v) => (v.key !== "value" || showValue) && (v.key !== "methods" || showMethods)
  );
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
