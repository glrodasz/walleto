import { Select } from "../../../components/atoms/Select";
import { SegmentedControl } from "../../../components/molecules/SegmentedControl";
import { MONTH_PERIODS } from "../../../constants";
import type { MonthPeriod } from "../../../constants";
import type { ChartMeasure } from "../helpers/worthStack";
import { useT } from "../../../hooks/useT";
import { COMMON_MESSAGES } from "../../../messages/common";
import { DOMAIN_MESSAGES } from "../messages";

export type StackMode = "category" | "currency";

interface Props {
  period: MonthPeriod;
  onPeriod: (period: MonthPeriod) => void;
  mode: StackMode;
  onMode: (mode: StackMode) => void;
  /** Only the account domains pass it: their bars can show worth or activity. */
  measure?: ChartMeasure;
  onMeasure?: (measure: ChartMeasure) => void;
}

/**
 * The chart card's controls: what the bars measure (account domains only),
 * how many months, and what they stack by.
 */
export function ChartControls({ period, onPeriod, mode, onMode, measure, onMeasure }: Props) {
  const t = useT(DOMAIN_MESSAGES);
  const common = useT(COMMON_MESSAGES);
  return (
    <div className="controls">
      {measure && onMeasure && (
        <SegmentedControl
          label={t("controls.barsShow")}
          size="sm"
          options={[
            { key: "worth", label: common("noun.worth") },
            { key: "activity", label: common("noun.activity") },
          ]}
          value={measure}
          onChange={onMeasure}
        />
      )}
      <SegmentedControl
        label={t("controls.stackBy")}
        size="sm"
        options={[
          { key: "category", label: common("noun.category") },
          { key: "currency", label: common("noun.currency") },
        ]}
        value={mode}
        onChange={onMode}
      />
      <div className="period">
        <Select
          aria-label={t("controls.period")}
          options={MONTH_PERIODS.map((p) => ({
            value: String(p),
            label: t("controls.lastMonths", { count: p }),
          }))}
          value={String(period)}
          onValueChange={(v) => onPeriod(Number(v) as MonthPeriod)}
        />
      </div>
      <style jsx>{`
        .controls {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .period {
          min-width: 150px;
        }
      `}</style>
    </div>
  );
}
