import { Select } from "../../../components/atoms/Select";
import { SegmentedControl } from "../../../components/molecules/SegmentedControl";
import { MONTH_PERIODS } from "../../../constants";
import type { MonthPeriod } from "../../../constants";
import type { ChartMeasure } from "../helpers/worthStack";

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
  return (
    <div className="controls">
      {measure && onMeasure && (
        <SegmentedControl
          label="Bars show"
          size="sm"
          options={[
            { key: "worth", label: "Worth" },
            { key: "activity", label: "Activity" },
          ]}
          value={measure}
          onChange={onMeasure}
        />
      )}
      <SegmentedControl
        label="Stack bars by"
        size="sm"
        options={[
          { key: "category", label: "Category" },
          { key: "currency", label: "Currency" },
        ]}
        value={mode}
        onChange={onMode}
      />
      <div className="period">
        <Select
          aria-label="Period"
          options={MONTH_PERIODS.map((p) => ({ value: String(p), label: `Last ${p} months` }))}
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
