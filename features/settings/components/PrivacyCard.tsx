import { Shield } from "../../../components/atoms/Icons";
import { t } from "../../../helpers/i18n";
import { SettingsCard } from "./SettingsCard";
import { SettingsRow } from "./SettingsRow";

/**
 * What happens to the data. Export and deletion are not self-service yet,
 * so the rows say so instead of promising a button that does nothing.
 */
export function PrivacyCard() {
  const support = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
  return (
    <SettingsCard
      title={t("settings.privacy.title")}
      subtitle={t("settings.privacy.subtitle")}
      icon={Shield}
    >
      <SettingsRow label="Data storage" value="All data is securely stored in the cloud." />
      <SettingsRow label="Data export" value="Coming soon." />
      <SettingsRow
        label="Account deletion"
        value={support ? "Write to us and we will delete everything." : "Contact support."}
        href={support ? `mailto:${support}?subject=Delete%20my%20Waletto%20account` : undefined}
      />
    </SettingsCard>
  );
}
