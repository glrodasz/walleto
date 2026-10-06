import { useState } from "react";
import { Select } from "../../../components/atoms/Select";
import { Coins } from "../../../components/atoms/Icons";
import { toggleCurrency } from "../../../helpers/currencies";
import { t } from "../../../helpers/i18n";
import { useEnabledCurrencies } from "../../../hooks/useEnabledCurrencies";
import { useMoneyContext } from "../../../hooks/useMoneyContext";
import { useUserDoc } from "../../../hooks/useUserDoc";
import type { Currency } from "../../../types";
import { CurrencyToggles } from "../../../components/molecules/CurrencyToggles";
import { SettingsCard } from "./SettingsCard";
import { SettingsRow } from "./SettingsRow";

/**
 * One choice, "Your currency": new entries start in it and totals convert into
 * it, so it writes both `mainCurrency` and `displayCurrency`. The header's
 * switcher still moves only the display currency, to read totals in another
 * one for a while. The chips pick which currencies show up in every picker.
 * Amounts always stay in the currency they were entered in.
 */
export function CurrencyCard() {
  const { userDoc, update } = useUserDoc();
  const { target } = useMoneyContext();
  const { currencies, optionsFor, setEnabledCurrencies } = useEnabledCurrencies();
  const [saving, setSaving] = useState(false);

  const save = async (run: () => Promise<void>, what: string) => {
    setSaving(true);
    try {
      await run();
    } catch (err) {
      console.error(`Failed to update ${what}:`, err);
    } finally {
      setSaving(false);
    }
  };

  const changeCurrency = (value: string) => {
    const currency = value as Currency;
    return save(() => update({ mainCurrency: currency, displayCurrency: currency }), "currency");
  };

  /**
   * The two currencies the app itself reads stay on: turning off what totals
   * convert into would leave the header's switcher pointing at nothing.
   */
  const lockedReason = (currency: Currency) => {
    if (currency === userDoc?.mainCurrency) return "Your currency is always available.";
    if (currency === target) return "Totals are shown in it right now.";
    return null;
  };

  const toggle = (currency: Currency) => {
    const next = toggleCurrency(currencies, currency);
    if (!next.length) return;
    return save(() => setEnabledCurrencies(next), "available currencies");
  };

  return (
    <SettingsCard
      title={t("settings.currency.title")}
      subtitle={t("settings.currency.subtitle")}
      icon={Coins}
    >
      <SettingsRow
        label="Your currency"
        control={
          <Select
            aria-label="Your currency"
            options={optionsFor(userDoc?.mainCurrency)}
            value={userDoc?.mainCurrency ?? ""}
            disabled={saving || !userDoc}
            onValueChange={changeCurrency}
          />
        }
        hint="New entries start in it and totals are shown in it. The switcher in the header changes how totals are shown at any time."
      />
      <SettingsRow
        label="Available currencies"
        fill
        control={
          <CurrencyToggles
            enabled={currencies}
            locked={lockedReason}
            onToggle={toggle}
            disabled={saving}
          />
        }
      />
    </SettingsCard>
  );
}
