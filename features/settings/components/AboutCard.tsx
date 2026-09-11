import { Heart, Info } from "../../../components/atoms/Icons";
import { t } from "../../../helpers/i18n";
import { SettingsCard } from "./SettingsCard";
import { SettingsRow } from "./SettingsRow";

/** Version, credits and where to write. */
export function AboutCard() {
  const version = process.env.NEXT_PUBLIC_APP_VERSION ?? "dev";
  const support = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
  const feedback = process.env.NEXT_PUBLIC_FEEDBACK_URL;
  return (
    <SettingsCard title={t("settings.about.title")} icon={Info}>
      <SettingsRow label="Version" value={version} />
      <SettingsRow
        label="Built with"
        value={
          <span className="built">
            <Heart size={13} /> for a more intentional financial life.
          </span>
        }
      />
      {support && (
        <SettingsRow label="Help & support" value="Get in touch" href={`mailto:${support}`} />
      )}
      {feedback && <SettingsRow label="Feedback" value="Share your thoughts" href={feedback} />}
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
