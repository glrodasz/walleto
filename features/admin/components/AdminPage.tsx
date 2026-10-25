import Head from "next/head";
import { PageLayout } from "../../../components/organisms/PageLayout";
import { useT } from "../../../hooks/useT";
import { ADMIN_MESSAGES } from "../messages";
import { useAdminUsage } from "../hooks/useAdminUsage";
import { AdminUsageView } from "./AdminUsageView";

export function AdminPage() {
  const t = useT(ADMIN_MESSAGES);
  const { usage, loading, error, reload } = useAdminUsage();
  return (
    <PageLayout title={t("page.title")} subtitle={t("page.subtitle")} hideCurrency hideMonth>
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminUsageView usage={usage} loading={loading} error={error} onRefresh={reload} />
    </PageLayout>
  );
}
