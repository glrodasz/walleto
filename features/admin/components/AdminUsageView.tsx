import { Card } from "../../../components/atoms/Card";
import { Button } from "../../../components/atoms/Button";
import { ErrorState } from "../../../components/atoms/ErrorState";
import { SectionTitle } from "../../../components/atoms/SectionTitle";
import Skeleton from "../../../components/Skeleton";
import { INTL_LOCALE } from "../../../helpers/i18n";
import { useDateFormat } from "../../../hooks/usePreferences";
import { useT } from "../../../hooks/useT";
import { ADMIN_MESSAGES } from "../messages";
import type { UsageSummary } from "../types";
import { KpiTiles } from "./KpiTiles";
import { SignupsChart } from "./SignupsChart";
import { UsersTable } from "./UsersTable";

interface Props {
  usage: UsageSummary | null;
  loading: boolean;
  error: Error | null;
  onRefresh?: () => void;
}

/** The dashboard body, driven by props so Storybook can mount it with fixtures. */
export function AdminUsageView({ usage, loading, error, onRefresh }: Props) {
  const t = useT(ADMIN_MESSAGES);
  const { language, formatDate } = useDateFormat();

  if (error && !usage) {
    return (
      <Card>
        <ErrorState title={t("page.loadError")} error={error} />
      </Card>
    );
  }

  if (!usage) {
    return (
      <div className="stack" aria-busy="true">
        <Skeleton.Box width="100%" height={96} />
        <Skeleton.Box width="100%" height={260} />
        <Skeleton.Box width="100%" height={320} />
        <style jsx>{`
          .stack {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
        `}</style>
      </div>
    );
  }

  const generated = new Date(usage.generatedAt);
  const time = new Intl.DateTimeFormat(INTL_LOCALE[language], {
    hour: "numeric",
    minute: "2-digit",
  }).format(generated);

  return (
    <div className="stack">
      <div className="toolbar">
        <span className="updated">
          {t("page.updated", { time: `${formatDate(generated, "day")}, ${time}` })}
        </span>
        {onRefresh && (
          <Button size="sm" onClick={onRefresh} disabled={loading}>
            {t("page.refresh")}
          </Button>
        )}
      </div>

      {usage.auth0 !== "ok" && (
        <p className="notice" role="status">
          {usage.auth0 === "error" ? t("auth0.error") : t("auth0.notConfigured")}
        </p>
      )}

      <KpiTiles totals={usage.totals} />

      <Card>
        <SectionTitle title={t("chart.title")} subtitle={t("chart.subtitle")} />
        <SignupsChart weeks={usage.weeklySignups} />
      </Card>

      <Card>
        <SectionTitle title={t("table.title")} subtitle={t("table.subtitle")} />
        <UsersTable users={usage.users} />
      </Card>

      <style jsx>{`
        .stack {
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-width: 0;
        }

        .toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .updated {
          font-size: 0.8rem;
          color: var(--fg-2);
        }

        .notice {
          margin: 0;
          padding: 10px 14px;
          border-radius: var(--r-md);
          border: 1px solid color-mix(in srgb, var(--accent-amber) 45%, transparent);
          background: color-mix(in srgb, var(--accent-amber) 12%, transparent);
          color: var(--fg-1);
          font-size: 0.82rem;
          line-height: 1.45;
        }
      `}</style>
    </div>
  );
}
