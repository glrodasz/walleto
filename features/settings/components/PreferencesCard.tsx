import { Select } from "../../../components/atoms/Select";
import { Monitor, Moon, Sliders, Sun } from "../../../components/atoms/Icons";
import { SegmentedControl } from "../../../components/molecules/SegmentedControl";
import { DATE_FORMAT_LABELS, formatDate } from "../../../helpers/dates";
import { LANGUAGE_LABELS, t } from "../../../helpers/i18n";
import { usePreferences } from "../../../hooks/usePreferences";
import { useTheme } from "../../../hooks/useTheme";
import { useUserDoc } from "../../../hooks/useUserDoc";
import type { DateFormat, Language, ThemePreference, WeekStart } from "../../../types";
import { SettingsCard } from "./SettingsCard";
import { SettingsRow } from "./SettingsRow";

const DATE_FORMATS: DateFormat[] = ["YMD", "DMY", "MDY"];

/** Start of week, date format, language and theme — saved on the user doc. */
export function PreferencesCard() {
  const { update } = useUserDoc();
  const { dateFormat, weekStart, language } = usePreferences();
  const { preference, setPreference } = useTheme();

  const save = (patch: Parameters<typeof update>[0]) =>
    update(patch).catch((err) => console.error("Failed to save preference:", err));

  return (
    <SettingsCard
      title={t("settings.preferences.title")}
      subtitle={t("settings.preferences.subtitle")}
      icon={Sliders}
    >
      <SettingsRow
        label="Start week on"
        control={
          <Select
            aria-label="Start week on"
            options={[
              { value: "1", label: t("weekStart.monday") },
              { value: "0", label: t("weekStart.sunday") },
            ]}
            value={String(weekStart)}
            onValueChange={(v) => save({ weekStart: Number(v) as WeekStart })}
          />
        }
      />
      <SettingsRow
        label="Date format"
        control={
          <Select
            aria-label="Date format"
            options={DATE_FORMATS.map((f) => ({ value: f, label: DATE_FORMAT_LABELS[f] }))}
            value={dateFormat}
            onValueChange={(v) => save({ dateFormat: v as DateFormat })}
          />
        }
        hint={`Example: ${formatDate(new Date(), "numeric", dateFormat)}`}
      />
      <SettingsRow
        label="Language"
        control={
          <Select
            aria-label="Language"
            options={(Object.keys(LANGUAGE_LABELS) as Language[]).map((l) => ({
              value: l,
              label: LANGUAGE_LABELS[l],
            }))}
            value={language}
            onValueChange={(v) => save({ language: v as Language })}
          />
        }
      />
      <SettingsRow
        label="Theme"
        control={
          <SegmentedControl<ThemePreference>
            label="Theme"
            options={[
              { key: "light", label: t("theme.light"), icon: Sun },
              { key: "dark", label: t("theme.dark"), icon: Moon },
              { key: "system", label: t("theme.system"), icon: Monitor },
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
