import { Chip } from "../../../components/atoms/Chip";
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
        <h2 className="heading">{t("currencies.yours")}</h2>
        <p className="hint">{t("currencies.yoursHint")}</p>
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
          margin: 0;
          font-size: 0.9375rem;
          font-weight: 600;
          color: var(--fg-1);
        }

        .hint {
          margin: 0;
          font-size: 0.8125rem;
          color: var(--fg-2);
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
