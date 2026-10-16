import { Select } from "../../../components/atoms/Select";
import { Monitor, Moon, Sliders, Sun } from "../../../components/atoms/Icons";
import { SegmentedControl } from "../../../components/molecules/SegmentedControl";
import { DATE_FORMAT_LABELS, formatDate } from "../../../helpers/dates";
import { LANGUAGE_LABELS, LANGUAGES, t } from "../../../helpers/i18n";
import { formatAmount } from "../../../helpers/money";
import { usePreferences } from "../../../hooks/usePreferences";
import { useT } from "../../../hooks/useT";
import { useTheme } from "../../../hooks/useTheme";
import { useUserDoc } from "../../../hooks/useUserDoc";
import { DECIMALS_OPTIONS } from "../../../utils/decimal";
import type {
  DateFormat,
  DecimalSeparator,
  Decimals,
  Language,
  ThemePreference,
  WeekStart,
} from "../../../types";
import { SETTINGS_MESSAGES } from "../messages";
import { SettingsCard } from "./SettingsCard";
import { SettingsRow } from "./SettingsRow";

const DATE_FORMATS: DateFormat[] = ["YMD", "DMY", "MDY"];

/** Start of week, date format, language, number format and theme — saved on the user doc. */
export function PreferencesCard() {
  const { update, userDoc } = useUserDoc();
  const { dateFormat, weekStart, language, decimalSeparator, decimals } = usePreferences();
  const { preference, setPreference } = useTheme();
  const tr = useT(SETTINGS_MESSAGES);
  const example = formatAmount(1234.5678, userDoc?.mainCurrency ?? "USD", {
    separator: decimalSeparator,
    decimals,
  });

  const save = (patch: Parameters<typeof update>[0]) =>
    update(patch).catch((err) => console.error("Failed to save preference:", err));

  return (
    <SettingsCard
      title={t("settings.preferences.title", language)}
      subtitle={t("settings.preferences.subtitle", language)}
      icon={Sliders}
    >
      <SettingsRow
        label={tr("preferences.weekStart")}
        control={
          <Select
            aria-label={tr("preferences.weekStart")}
            options={[
              { value: "1", label: t("weekStart.monday", language) },
              { value: "0", label: t("weekStart.sunday", language) },
            ]}
            value={String(weekStart)}
            onValueChange={(v) => save({ weekStart: Number(v) as WeekStart })}
          />
        }
      />
      <SettingsRow
        label={tr("preferences.dateFormat")}
        control={
          <Select
            aria-label={tr("preferences.dateFormat")}
            options={DATE_FORMATS.map((f) => ({ value: f, label: DATE_FORMAT_LABELS[f] }))}
            value={dateFormat}
            onValueChange={(v) => save({ dateFormat: v as DateFormat })}
          />
        }
        hint={tr("preferences.example", { value: formatDate(new Date(), "numeric", dateFormat) })}
      />
      <SettingsRow
        label={tr("preferences.language")}
        control={
          <Select
            aria-label={tr("preferences.language")}
            options={LANGUAGES.map((l) => ({ value: l, label: LANGUAGE_LABELS[l] }))}
            value={language}
            onValueChange={(v) => save({ language: v as Language })}
          />
        }
      />
      <SettingsRow
        label={tr("preferences.decimalSeparator")}
        control={
          <Select
            aria-label={tr("preferences.decimalSeparator")}
            options={[
              { value: ".", label: tr("preferences.separator.point") },
              { value: ",", label: tr("preferences.separator.comma") },
            ]}
            value={decimalSeparator}
            onValueChange={(v) => save({ decimalSeparator: v as DecimalSeparator })}
          />
        }
        hint={tr("preferences.separatorHint")}
      />
      <SettingsRow
        label={tr("preferences.decimals")}
        control={
          <Select
            aria-label={tr("preferences.decimals")}
            options={DECIMALS_OPTIONS.map((d) => ({ value: String(d), label: String(d) }))}
            value={String(decimals)}
            onValueChange={(v) => save({ decimals: Number(v) as Decimals })}
          />
        }
        hint={tr("preferences.example", { value: example })}
      />
      <SettingsRow
        label={tr("preferences.theme")}
        control={
          <SegmentedControl<ThemePreference>
            label={tr("preferences.theme")}
            options={[
              { key: "light", label: t("theme.light", language), icon: Sun },
              { key: "dark", label: t("theme.dark", language), icon: Moon },
              { key: "system", label: t("theme.system", language), icon: Monitor },
            ]}
            value={preference}
            onChange={(next) =>
              setPreference(next).catch((err) => console.error("Failed to save theme:", err))
            }
          />
        }
      />
    </SettingsCard>
  );
}
