import { useUser } from "@auth0/nextjs-auth0/client";
import { withOnboardingGuard } from "../features/onboarding/helpers/onboardingGuard";
import { PageLayout } from "../components/organisms/PageLayout";
import { StatCard } from "../components/molecules/StatCard";
import { ExpenseBreakdown } from "../features/dashboard/components/ExpenseBreakdown";
import { RecentPayments } from "../features/dashboard/components/RecentPayments";
import { UpcomingExpirations } from "../features/dashboard/components/UpcomingExpirations";
import Skeleton from "../components/Skeleton";
import { ErrorState } from "../components/atoms/ErrorState";
import { NetFlowCard } from "../features/dashboard/components/NetFlowCard";
import { topWithOther } from "../features/dashboard/helpers/topWithOther";
import { Card } from "../components/atoms/Card";
import { SectionTitle } from "../components/atoms/SectionTitle";
import { MonthlyBarsChart } from "../components/molecules/MonthlyBarsChart";
import { useDashboard } from "../features/dashboard/hooks/useDashboard";
import { useUserDoc } from "../hooks/useUserDoc";
import { useMaterialize } from "../hooks/useMaterialize";
import { updateRecurrentItem } from "../hooks/useRecurrentTransactions";

export const getServerSideProps = withOnboardingGuard();

export default function Dashboard() {
  const { user } = useUser();
  const { userDoc } = useUserDoc();
  useMaterialize();
  const {
    currency,
    totals,
    flow,
    approximate,
    fxUnavailable,
    expensesByCategory,
    incomesByCategory,
    investmentsByCategory,
    savingsByCategory,
    currencyMix,
    recentPayments,
    upcoming,
    markPaid,
    momDelta,
    flowSeries,
    loading,
    error,
  } = useDashboard();

  const firstName = (user?.name ?? user?.nickname ?? "there").split(" ")[0];

  return (
    <PageLayout title={`Welcome back, ${firstName}`}>
      {error && <ErrorState error={error} />}
      {fxUnavailable && (
        <ErrorState
          title="Exchange rates unavailable"
          description="Totals mix currencies without conversion right now. They'll correct themselves when rates load again."
        />
      )}

      <section className="row">
        {userDoc ? (
          <NetFlowCard flow={flow} currency={currency} approximate={approximate} />
        ) : (
          <Skeleton.Box width="100%" height={140} />
        )}
      </section>

      <section className="row">
        {userDoc ? (
          <>
            <StatCard
              title="Income"
              amount={totals.income}
              currency={currency}
              domain="INCOME"
              summary={incomesByCategory.slice(0, 2)}
              byCurrency={currencyMix.income}
            />
            <StatCard
              title="Expenses"
              amount={totals.expense}
              currency={currency}
              domain="EXPENSE"
              delta={momDelta.deltaPct}
              summary={expensesByCategory.slice(0, 2)}
              byCurrency={currencyMix.expense}
            />
            <StatCard
              title="Investments"
              amount={totals.investment}
              currency={currency}
              domain="INVESTMENT"
              summary={investmentsByCategory.slice(0, 2)}
              byCurrency={currencyMix.investment}
            />
            <StatCard
              title="Savings"
              amount={totals.saving}
              currency={currency}
              domain="SAVING"
              summary={savingsByCategory.slice(0, 2)}
              byCurrency={currencyMix.saving}
            />
          </>
        ) : (
          <>
            <Skeleton.Box width="100%" height={120} />
            <Skeleton.Box width="100%" height={120} />
            <Skeleton.Box width="100%" height={120} />
            <Skeleton.Box width="100%" height={120} />
          </>
        )}
      </section>

      <section className="row">
        <Card>
          <SectionTitle title="Cash flow" />
          <p className="panel-note">Monthly totals · this month is still in progress.</p>
          <MonthlyBarsChart
            data={flowSeries}
            series={[
              { key: "income", label: "Income", color: "var(--domain-income)" },
              { key: "expense", label: "Expenses", color: "var(--domain-expense)" },
            ]}
            currency={currency}
            loading={loading}
          />
        </Card>
      </section>

      <section className="row">
        <ExpenseBreakdown
          rows={topWithOther(expensesByCategory, 5)}
          currency={currency}
          loading={loading}
        />
        <RecentPayments
          transactions={recentPayments}
          displayCurrency={currency}
          loading={loading}
        />
        <UpcomingExpirations
          items={upcoming}
          displayCurrency={currency}
          loading={loading}
          onMarkPaid={markPaid}
          onHide={(id) => updateRecurrentItem(id, { hiddenFromDashboard: true })}
        />
      </section>

      <style jsx>{`
        .panel-note {
          margin: -4px 0 4px;
          font-size: 0.78rem;
          color: var(--fg-2);
        }

        .row {
          display: flex;
          gap: 16px;
        }

        .row > :global(*) {
          flex: 1;
          min-width: 0;
        }

        @media (max-width: 1100px) {
          .row {
            flex-wrap: wrap;
          }

          .row > :global(*) {
            flex-basis: calc(50% - 8px);
          }
        }

        @media (max-width: 640px) {
          .row {
            flex-direction: column;
          }

          .row > :global(*) {
            flex-basis: auto;
          }
        }
      `}</style>
    </PageLayout>
  );
}
