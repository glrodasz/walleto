import { useUser } from "@auth0/nextjs-auth0/client";
import { Button } from "../../../components/atoms/Button";
import { User } from "../../../components/atoms/Icons";
import { t } from "../../../helpers/i18n";
import { SettingsCard } from "./SettingsCard";
import { SettingsRow } from "./SettingsRow";

/**
 * Where the identity is managed. Auth0 owns name, password and second
 * factor, so those rows only point at its account page when one is
 * configured (NEXT_PUBLIC_AUTH0_ACCOUNT_URL); without it they stay quiet.
 */
export function AccountCard() {
  const { user } = useUser();
  const accountUrl = process.env.NEXT_PUBLIC_AUTH0_ACCOUNT_URL;

  return (
    <SettingsCard
      title={t("settings.account.title")}
      subtitle={t("settings.account.subtitle")}
      icon={User}
      action={
        accountUrl ? (
          <a href={accountUrl} target="_blank" rel="noreferrer" className="edit">
            <Button variant="secondary" size="sm">
              Edit profile
            </Button>
          </a>
        ) : undefined
      }
    >
      <SettingsRow label="Name" value={user?.name ?? "—"} />
      <SettingsRow label="Email" value={user?.email ?? "—"} />
      <SettingsRow
        label="Password"
        value="••••••••"
        hint={accountUrl ? undefined : "Managed by your sign-in provider."}
        href={accountUrl}
      />
      <SettingsRow
        label="Two-factor authentication"
        value="Managed by your sign-in provider"
        href={accountUrl}
      />
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/api/auth/logout" className="logout">
        Log out
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
