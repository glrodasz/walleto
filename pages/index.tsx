import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter } from "next/router";
import { withOnboardingGuard } from "../features/onboarding/helpers/onboardingGuard";
import { PageLayout } from "../components/organisms/PageLayout";
import { StatCard } from "../components/molecules/StatCard";
import type { StatRow } from "../components/molecules/StatCard";
import { CategoryBreakdown } from "../components/molecules/CategoryBreakdown";
import { formatAmount } from "../components/atoms/Amount";
import Skeleton from "../components/Skeleton";
import { ErrorState } from "../components/atoms/ErrorState";
import { NetFlowCard } from "../features/dashboard/components/NetFlowCard";
import { CashFlowCard } from "../features/dashboard/components/CashFlowCard";
import type { CashFlowPeriod } from "../features/dashboard/components/CashFlowCard";
import { UpcomingPayments } from "../features/dashboard/components/UpcomingPayments";
import { TipBanner } from "../features/dashboard/components/TipBanner";
import { topWithOther } from "../features/dashboard/helpers/topWithOther";
import type { CashFlowGroupBy } from "../features/dashboard/helpers/cashFlowSeries";
import { useDashboard } from "../features/dashboard/hooks/useDashboard";
import { useUserDoc } from "../hooks/useUserDoc";
import { useMaterialize } from "../hooks/useMaterialize";
import { useSelectedMonth } from "../hooks/useSelectedMonth";
import { useLocalPreference } from "../hooks/useLocalPreference";
import { greeting } from "../helpers/greeting";
import type { Currency, Domain } from "../types";

export const getServerSideProps = withOnboardingGuard();

interface CategoryAmount {
  categoryId: string;
  name: string;
  amount: number;
  percent: number;
}

/** Income shows amounts; the other cards show each category's share. */
function cardRows(list: CategoryAmount[], domain: Domain, currency: Currency): StatRow[] {
  return list.slice(0, 2).map((c) => ({
    name: c.name,
    value: domain === "INCOME" ? formatAmount(c.amount, currency) : `${c.percent.toFixed(0)}%`,
  }));
}

export default function Dashboard() {
  const { user } = useUser();
  const router = useRouter();
  const { userDoc } = useUserDoc();
  const { select } = useSelectedMonth();
  useMaterialize();
  const [period, setPeriod] = useLocalPreference<CashFlowPeriod>("waletto:dashboard:period", 6);
  const [groupBy, setGroupBy] = useLocalPreference<CashFlowGroupBy>(
    "waletto:dashboard:groupBy",
    "domain"
  );
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
    categories,
    upcoming,
    cashFlow,
    selectedKey,
    window,
    loading,
    error,
  } = useDashboard({ period, groupBy });

  const firstName = (user?.name ?? user?.nickname ?? "there").split(" ")[0];

  const cards: {
    domain: Domain;
    title: string;
    href: string;
    amount: number;
    list: CategoryAmount[];
    mix: { currency: Currency; pct: number }[];
  }[] = [
    {
      domain: "INCOME",
      title: "Income",
      href: "/incomes",
      amount: totals.income,
      list: incomesByCategory,
      mix: currencyMix.income,
    },
    {
      domain: "EXPENSE",
      title: "Expenses",
      href: "/expenses",
      amount: totals.expense,
      list: expensesByCategory,
      mix: currencyMix.expense,
    },
    {
      domain: "INVESTMENT",
      title: "Investments",
      href: "/investments",
      amount: totals.investment,
      list: investmentsByCategory,
      mix: currencyMix.investment,
    },
    {
      domain: "SAVING",
      title: "Savings",
      href: "/savings",
      amount: totals.saving,
      list: savingsByCategory,
      mix: currencyMix.saving,
    },
  ];

  return (
    <PageLayout
      title={`${greeting()}, ${firstName}`}
      subtitle={`Here's your financial overview for ${window.longLabel}.`}
      /* The dashboard is the whole picture, not one month's ledger: the month
         is picked on a domain page, or by clicking a bar in the cash flow. */
      hideMonth
    >
      {error && <ErrorState error={error} />}
      {fxUnavailable && (
        <ErrorState
          title="Exchange rates unavailable"
          description="Totals mix currencies without conversion right now. They'll correct themselves when rates load again."
        />
      )}

      <section className="block">
        {userDoc ? (
          <NetFlowCard flow={flow} currency={currency} approximate={approximate} />
        ) : (
          <Skeleton.Box width="100%" height={160} />
        )}
      </section>

      <section className="cards">
        {userDoc
          ? cards.map((c) => (
              <StatCard
                key={c.domain}
                title={c.title}
                href={c.href}
                amount={c.amount}
                currency={currency}
                domain={c.domain}
                rows={cardRows(c.list, c.domain, currency)}
                categoryCount={c.list.length}
                byCurrency={c.mix}
                actions={[{ label: `Open ${c.title}`, onSelect: () => router.push(c.href) }]}
              />
            ))
          : cards.map((c) => <Skeleton.Box key={c.domain} width="100%" height={180} />)}
      </section>

      <section className="block">
        <CashFlowCard
          data={cashFlow.data}
          groups={cashFlow.groups}
          currency={currency}
          loading={loading}
          period={period}
          onPeriod={setPeriod}
          groupBy={groupBy}
          onGroupBy={setGroupBy}
          selectedKey={selectedKey}
          onSelect={select}
        />
      </section>

      <section className="bottom">
        <CategoryBreakdown
          title="Top expense categories"
          rows={topWithOther(expensesByCategory, 5)}
          categories={categories}
          domain="EXPENSE"
          currency={currency}
          href="/expenses"
          loading={loading}
        />
        <UpcomingPayments
          items={upcoming}
          categories={categories}
          displayCurrency={currency}
          loading={loading}
        />
      </section>

      <TipBanner id="create">
        You can add a new transaction or recurring item from the + button.
      </TipBanner>

      <style jsx>{`
        .block {
          display: flex;
        }

        .block > :global(*) {
          flex: 1;
          min-width: 0;
        }

        .cards {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }

        .bottom {
          display: grid;
          grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
          gap: 16px;
        }

        @media (max-width: 1100px) {
          .cards {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 767px) {
          .cards,
          .bottom {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </PageLayout>
  );
}
