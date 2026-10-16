import { useUser } from "@auth0/nextjs-auth0/client";
import { Button } from "../../../components/atoms/Button";
import { User } from "../../../components/atoms/Icons";
import { t } from "../../../helpers/i18n";
import { SettingsCard } from "./SettingsCard";
import { SettingsRow } from "./SettingsRow";
import { LOGOUT_HREF, useLogout } from "../../../hooks/useLogout";
import { COMMON_MESSAGES } from "../../../messages/common";
import { usePreferences } from "../../../hooks/usePreferences";
import { useT } from "../../../hooks/useT";
import { SETTINGS_MESSAGES } from "../messages";

/**
 * Where the identity is managed. Auth0 owns name, password and second
 * factor, so those rows only point at its account page when one is
 * configured (NEXT_PUBLIC_AUTH0_ACCOUNT_URL); without it they stay quiet.
 */
export function AccountCard() {
  const { user } = useUser();
  const logout = useLogout();
  const accountUrl = process.env.NEXT_PUBLIC_AUTH0_ACCOUNT_URL;
  const { language } = usePreferences();
  const tr = useT(SETTINGS_MESSAGES);
  const tc = useT(COMMON_MESSAGES);

  return (
    <SettingsCard
      title={t("settings.account.title", language)}
      subtitle={t("settings.account.subtitle", language)}
      icon={User}
      action={
        accountUrl ? (
          <a href={accountUrl} target="_blank" rel="noreferrer" className="edit">
            <Button variant="secondary" size="sm">
              {tr("account.editProfile")}
            </Button>
          </a>
        ) : undefined
      }
    >
      <SettingsRow label={tc("noun.name")} value={user?.name ?? "—"} />
      <SettingsRow label={tr("account.email")} value={user?.email ?? "—"} />
      <SettingsRow
        label={tr("account.password")}
        value="••••••••"
        hint={accountUrl ? undefined : tr("account.managedHint")}
        href={accountUrl}
      />
      <SettingsRow
        label={tr("account.twoFactor")}
        value={tr("account.managed")}
        href={accountUrl}
      />
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href={LOGOUT_HREF} className="logout" onClick={logout}>
        {tr("account.logOut")}
      </a>
      <style jsx>{`
        .logout {
          margin-top: 12px;
          align-self: flex-start;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--accent-hot);
          text-decoration: none;
        }

        .logout:hover {
          text-decoration: underline;
        }
      `}</style>
    </SettingsCard>
  );
}
