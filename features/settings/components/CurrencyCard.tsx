import { useState } from "react";
import { Select } from "../../../components/atoms/Select";
import { Coins } from "../../../components/atoms/Icons";
import { CURRENCIES, CURRENCY_SYMBOL, SELECTABLE_CURRENCIES } from "../../../constants";
import { t } from "../../../helpers/i18n";
import { useMoneyContext } from "../../../hooks/useMoneyContext";
import { useUserDoc } from "../../../hooks/useUserDoc";
import type { Currency } from "../../../types";
import { SettingsCard } from "./SettingsCard";
import { SettingsRow } from "./SettingsRow";

const CURRENCY_OPTIONS = SELECTABLE_CURRENCIES.map((c) => ({
  value: c.value,
  label: `${CURRENCY_SYMBOL[c.value]} ${c.label}`,
}));

/**
 * Main currency is the default for new entries; display currency is what
 * totals convert into (the same switch as the header's). Amounts always stay
 * in the currency they were entered in.
 */
export function CurrencyCard() {
  const { userDoc, update } = useUserDoc();
  const { target, setDisplayCurrency } = useMoneyContext();
  const [saving, setSaving] = useState(false);

  const changeMain = async (currency: string) => {
    setSaving(true);
    try {
      await update({ mainCurrency: currency as Currency });
    } catch (err) {
      console.error("Failed to update main currency:", err);
    } finally {
      setSaving(false);
    }
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
            options={CURRENCY_OPTIONS}
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
            options={CURRENCY_OPTIONS}
            value={target}
            onValueChange={(v) => setDisplayCurrency(v as Currency)}
          />
        }
        hint="Used for totals and conversions. You can change this anytime."
      />
      <SettingsRow label="Supported currencies" value={CURRENCIES.join(", ")} />
    </SettingsCard>
  );
}
