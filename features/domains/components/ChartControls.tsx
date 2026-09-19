import { Select } from "../../../components/atoms/Select";
import { SegmentedControl } from "../../../components/molecules/SegmentedControl";
import { MONTH_PERIODS } from "../../../constants";
import type { MonthPeriod } from "../../../constants";

export type StackMode = "category" | "currency";

interface Props {
  period: MonthPeriod;
  onPeriod: (period: MonthPeriod) => void;
  mode: StackMode;
  onMode: (mode: StackMode) => void;
}

/** The chart card's controls: how many months, and what the bars stack by. */
export function ChartControls({ period, onPeriod, mode, onMode }: Props) {
  return (
    <div className="controls">
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
