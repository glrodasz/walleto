import { Chip } from "../../../components/atoms/Chip";
import { InfoTip } from "../../../components/atoms/InfoTip";
import { SELECTABLE_CURRENCIES } from "../../../constants";
import { useT } from "../../../hooks/useT";
import type { Currency } from "../../../types";
import { ONBOARDING_MESSAGES } from "../messages";

interface Props {
  value: Currency;
  onChange: (currency: Currency) => void;
}

export function CurrencyPicker({ value, onChange }: Props) {
  const t = useT(ONBOARDING_MESSAGES);
  return (
    <section className="picker">
      <header className="head">
        <h2 className="heading">
          {t("currencies.yours")}
          <InfoTip label={t("currencies.yoursLabel")} placement="bottom">
            {t("currencies.yoursHint")}
          </InfoTip>
        </h2>
      </header>
      <div className="chips" role="group" aria-label={t("currencies.yours")}>
        {SELECTABLE_CURRENCIES.map((c) => (
          <Chip key={c.value} selected={c.value === value} onClick={() => onChange(c.value)}>
            {c.label}
          </Chip>
        ))}
      </div>

      <style jsx>{`
        .picker {
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding-bottom: 28px;
          border-bottom: 1px solid var(--line);
        }

        .head {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .heading {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0;
          font-size: 0.9375rem;
          font-weight: 600;
          color: var(--fg-1);
        }

        .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
      `}</style>
    </section>
  );
}
