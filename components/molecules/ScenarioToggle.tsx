import { useEffect, useState } from "react";
import { SegmentedControl } from "./SegmentedControl";
import { InfoTip } from "../atoms/InfoTip";
import { useT } from "../../hooks/useT";
import { UI_MESSAGES } from "../../messages/ui";
import type { Scenario } from "../../types";

const SCENARIOS: Scenario[] = ["floor", "average", "top"];

interface Props {
  value: Scenario;
  onChange: (scenario: Scenario) => void | Promise<void>;
}

/**
 * Best / Average / Worst: which end of each variable expense's band every
 * total counts. The pick shows at once; the figures follow when the saved
 * choice comes back from the account.
 */
export function ScenarioToggle({ value, onChange }: Props) {
  const t = useT(UI_MESSAGES);
  const [picked, setPicked] = useState(value);
  useEffect(() => setPicked(value), [value]);

  const choose = (next: Scenario) => {
    setPicked(next);
    Promise.resolve(onChange(next)).catch(() => setPicked(value));
  };

  return (
    <div className="scenario">
      <span className="label">
        {t("scenario.label")} <InfoTip label={t("scenario.about")}>{t("scenario.hint")}</InfoTip>
      </span>
      <SegmentedControl<Scenario>
        label={t("scenario.label")}
        size="sm"
        options={SCENARIOS.map((key) => ({ key, label: t(`scenario.${key}`) }))}
        value={picked}
        onChange={choose}
      />
      <style jsx>{`
        .scenario {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          flex-wrap: wrap;
          gap: 10px;
        }

        .label {
          font-size: 0.8rem;
          color: var(--fg-2);
        }
      `}</style>
    </div>
  );
}
