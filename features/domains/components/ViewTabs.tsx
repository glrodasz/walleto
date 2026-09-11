import { TabStrip } from "../../../components/atoms/TabStrip";

export type DomainView = "categories" | "transactions" | "recurring" | "value";

interface Props {
  value: DomainView;
  onChange: (view: DomainView) => void;
  accent: string;
  /** Investments add a fourth view: what each category is worth. */
  showValue?: boolean;
}

const VIEWS: { key: DomainView; label: string }[] = [
  { key: "categories", label: "Categories" },
  { key: "transactions", label: "Transactions" },
  { key: "recurring", label: "Recurring" },
];

/** Three views of the same month: aggregated, raw, and the plan (+ value for investments). */
export function ViewTabs({ value, onChange, accent, showValue }: Props) {
  const views = showValue ? [...VIEWS, { key: "value" as DomainView, label: "Value" }] : VIEWS;
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
