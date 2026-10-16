import { Shield } from "../../../components/atoms/Icons";
import { t } from "../../../helpers/i18n";
import { usePreferences } from "../../../hooks/usePreferences";
import { useT } from "../../../hooks/useT";
import { SETTINGS_MESSAGES } from "../messages";
import { SettingsCard } from "./SettingsCard";
import { SettingsRow } from "./SettingsRow";

/**
 * What happens to the data. Export and deletion are not self-service yet,
 * so the rows say so instead of promising a button that does nothing.
 */
export function PrivacyCard() {
  const support = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
  const { language } = usePreferences();
  const tr = useT(SETTINGS_MESSAGES);
  return (
    <SettingsCard
      title={t("settings.privacy.title", language)}
      subtitle={t("settings.privacy.subtitle", language)}
      icon={Shield}
    >
      <SettingsRow label={tr("privacy.storage")} value={tr("privacy.storageValue")} />
      <SettingsRow label={tr("privacy.export")} value={tr("privacy.exportValue")} />
      <SettingsRow
        label={tr("privacy.deletion")}
        value={support ? tr("privacy.deletionWrite") : tr("privacy.deletionContact")}
        href={support ? `mailto:${support}?subject=Delete%20my%20Walleto%20account` : undefined}
      />
    </SettingsCard>
  );
}
