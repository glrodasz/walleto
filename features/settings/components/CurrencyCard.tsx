import { useState } from "react";
import { Select } from "../../../components/atoms/Select";
import { Coins } from "../../../components/atoms/Icons";
import { toggleCurrency } from "../../../helpers/currencies";
import { t } from "../../../helpers/i18n";
import { useEnabledCurrencies } from "../../../hooks/useEnabledCurrencies";
import { useMoneyContext } from "../../../hooks/useMoneyContext";
import { useUserDoc } from "../../../hooks/useUserDoc";
import type { Currency } from "../../../types";
import { CurrencyToggles } from "./CurrencyToggles";
import { SettingsCard } from "./SettingsCard";
import { SettingsRow } from "./SettingsRow";

/**
 * Main currency is the default for new entries; display currency is what
 * totals convert into (the same switch as the header's); the chips pick which
 * currencies show up in every picker. Amounts always stay in the currency they
 * were entered in.
 */
export function CurrencyCard() {
  const { userDoc, update } = useUserDoc();
  const { target, setDisplayCurrency } = useMoneyContext();
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

  const changeMain = (currency: string) =>
    save(() => update({ mainCurrency: currency as Currency }), "main currency");

  /**
   * The two currencies the app itself reads stay on: turning off what totals
   * convert into would leave the display select pointing at nothing.
   */
  const lockedReason = (currency: Currency) => {
    if (currency === userDoc?.mainCurrency) return "Your main currency is always available.";
    if (currency === target) return "Your display currency is always available.";
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
        label="Main currency"
        control={
          <Select
            aria-label="Main currency"
            options={optionsFor(userDoc?.mainCurrency)}
            value={userDoc?.mainCurrency ?? ""}
            disabled={saving || !userDoc}
            onValueChange={changeMain}
          />
        }
        hint="Default for new entries."
      />
      <SettingsRow
        label="Display currency"
        control={
          <Select
            aria-label="Display currency"
            options={optionsFor(target)}
            value={target}
            disabled={saving}
            onValueChange={(v) => setDisplayCurrency(v as Currency)}
          />
        }
        hint="Used for totals and conversions. You can change this anytime."
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
