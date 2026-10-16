import { Heart, Info } from "../../../components/atoms/Icons";
import { t } from "../../../helpers/i18n";
import { usePreferences } from "../../../hooks/usePreferences";
import { useT } from "../../../hooks/useT";
import { SETTINGS_MESSAGES } from "../messages";
import { SettingsCard } from "./SettingsCard";
import { SettingsRow } from "./SettingsRow";

/** Version, credits and where to write. */
export function AboutCard() {
  const version = process.env.NEXT_PUBLIC_APP_VERSION ?? "dev";
  const support = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
  const feedback = process.env.NEXT_PUBLIC_FEEDBACK_URL;
  const { language } = usePreferences();
  const tr = useT(SETTINGS_MESSAGES);
  return (
    <SettingsCard title={t("settings.about.title", language)} icon={Info}>
      <SettingsRow label={tr("about.version")} value={version} />
      <SettingsRow
        label={tr("about.builtWith")}
        value={
          <span className="built">
            <Heart size={13} /> {tr("about.builtFor")}
          </span>
        }
      />
      {support && (
        <SettingsRow
          label={tr("about.support")}
          value={tr("about.supportValue")}
          href={`mailto:${support}`}
        />
      )}
      {feedback && (
        <SettingsRow
          label={tr("about.feedback")}
          value={tr("about.feedbackValue")}
          href={feedback}
        />
      )}
      <style jsx>{`
        .built {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
      `}</style>
    </SettingsCard>
  );
}
