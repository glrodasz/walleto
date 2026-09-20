import { useState } from "react";
import { Shield } from "../../../components/atoms/Icons";
import { t } from "../../../helpers/i18n";
import { DeleteAccountModal } from "./DeleteAccountModal";
import { SettingsCard } from "./SettingsCard";
import { SettingsRow } from "./SettingsRow";

/** The privacy policy, where the data lives, and the two rights exercised in-app: export and erasure. */
export function PrivacyCard() {
  const support = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
  const [deleting, setDeleting] = useState(false);

  return (
    <SettingsCard
      title={t("settings.privacy.title")}
      subtitle={t("settings.privacy.subtitle")}
      icon={Shield}
    >
      <SettingsRow
        label={t("settings.privacy.policy")}
        value={t("settings.privacy.policy.value")}
        href="/privacy"
      />
      <SettingsRow
        label={t("settings.privacy.storage")}
        value={t("settings.privacy.storage.value")}
      />
      <SettingsRow
        label={t("settings.privacy.export")}
        value={t("settings.privacy.export.value")}
        href="/api/account/export"
      />
      {support && (
        <SettingsRow
          label={t("settings.privacy.contact")}
          value={support}
          href={`mailto:${support}?subject=Waletto%20privacy`}
        />
      )}
      <SettingsRow
        label={t("settings.privacy.delete")}
        value={t("settings.privacy.delete.value")}
        onClick={() => setDeleting(true)}
        danger
      />
      <DeleteAccountModal open={deleting} onClose={() => setDeleting(false)} />
    </SettingsCard>
  );
}
