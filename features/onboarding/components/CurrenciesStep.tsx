import { InfoTip } from "../../../components/atoms/InfoTip";
import { CurrencyToggles } from "../../../components/molecules/CurrencyToggles";
import { CurrencyPicker } from "./CurrencyPicker";
import type { useCurrenciesStep } from "../hooks/useCurrenciesStep";

interface Props {
  state: ReturnType<typeof useCurrenciesStep>;
}

/**
 * Before any amount is typed: the currency the plan is read in, and every
 * currency the owner gets paid or pays in — the ones the Income and Expenses
 * rows will offer (Settings › Currency edits the same two things).
 */
export function CurrenciesStep({ state }: Props) {
  const { currency, setCurrency, enabled, locked, toggle } = state;

  return (
    <div className="step">
      <CurrencyPicker value={currency} onChange={setCurrency} />

      <section className="offered">
        <header className="head">
          <h2 className="heading">
            Currencies you use
            <InfoTip label="About turning off a currency" placement="bottom">
              Amounts already saved in a currency you turn off keep it — it just stops being offered
              for new ones.
            </InfoTip>
          </h2>
          <p className="hint">
            Turn on every currency you earn or pay in — these are the ones offered when you enter an
            amount.
          </p>
        </header>
        <CurrencyToggles enabled={enabled} locked={locked} onToggle={toggle} />
      </section>

      <style jsx>{`
        .step {
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .offered {
          display: flex;
          flex-direction: column;
          gap: 14px;
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

        .hint {
          margin: 0;
          font-size: 0.8125rem;
          color: var(--fg-2);
        }
      `}</style>
    </div>
  );
}
