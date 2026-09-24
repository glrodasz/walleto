import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter } from "next/router";
import { PageLayout } from "../../../components/organisms/PageLayout";
import { StatCard } from "../../../components/molecules/StatCard";
import type { StatRow } from "../../../components/molecules/StatCard";
import { CategoryBreakdown } from "../../../components/molecules/CategoryBreakdown";
import Skeleton from "../../../components/Skeleton";
import { ErrorState } from "../../../components/atoms/ErrorState";
import { NetFlowCard } from "./NetFlowCard";
import { CashFlowCard } from "./CashFlowCard";
import { UpcomingPayments } from "./UpcomingPayments";
import { TipBanner } from "./TipBanner";
import { DomainValueLine } from "../../investments/components/DomainValueLine";
import { isAccountDomain } from "../../../helpers/accounts";
import { topWithOther } from "../helpers/topWithOther";
import type { CashFlowGroupBy } from "../helpers/cashFlowSeries";
import { useDashboard } from "../hooks/useDashboard";
import { useUserDoc } from "../../../hooks/useUserDoc";
import { useMaterialize } from "../../../hooks/useMaterialize";
import { useLocalPreference } from "../../../hooks/useLocalPreference";
import { useMoneyFormat } from "../../../hooks/useMoneyFormat";
import { greeting } from "../../../helpers/greeting";
import { DEFAULT_MONTH_PERIOD, parseMonthPeriod } from "../../../constants";
import type { MonthPeriod } from "../../../constants";
import type { Currency, Domain } from "../../../types";

interface CategoryAmount {
  categoryId: string;
  name: string;
  amount: number;
  percent: number;
}

/**
 * Income shows amounts; the other cards show each category's share. The
 * formatter comes from the caller because it is bound to privacy mode.
 */
function cardRows(
  list: CategoryAmount[],
  domain: Domain,
  currency: Currency,
  formatAmount: (value: number, currency: Currency) => string
): StatRow[] {
  return list.slice(0, 2).map((c) => ({
    name: c.name,
    value: domain === "INCOME" ? formatAmount(c.amount, currency) : `${c.percent.toFixed(0)}%`,
  }));
}

export function DashboardPage() {
  const { user } = useUser();
  const router = useRouter();
  const { userDoc } = useUserDoc();
  const { formatAmount } = useMoneyFormat();
  useMaterialize();
  const [period, setPeriod] = useLocalPreference<MonthPeriod>(
    "waletto:dashboard:period",
    DEFAULT_MONTH_PERIOD,
    parseMonthPeriod
  );
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
    debtsByCategory,
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
    {
      domain: "DEBT",
      title: "Debts",
      href: "/debts",
      amount: totals.debt,
      list: debtsByCategory,
      mix: currencyMix.debt,
    },
  ];

  return (
    <PageLayout
      title={`${greeting()}, ${firstName}`}
      subtitle={`Here's your financial overview for ${window.longLabel}.`}
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
                rows={cardRows(c.list, c.domain, currency, formatAmount)}
                categoryCount={c.list.length}
                byCurrency={c.mix}
                secondary={
                  isAccountDomain(c.domain) ? (
                    <DomainValueLine
                      domain={c.domain}
                      categories={categories}
                      currency={currency}
                    />
                  ) : undefined
                }
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
          loading={loading.cashFlow}
          period={period}
          onPeriod={setPeriod}
          groupBy={groupBy}
          onGroupBy={setGroupBy}
          selectedKey={selectedKey}
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
          loading={loading.expenseCategories}
        />
        <UpcomingPayments
          items={upcoming}
          categories={categories}
          displayCurrency={currency}
          loading={loading.upcoming}
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
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 16px;
        }

        .bottom {
          display: grid;
          grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
          gap: 16px;
        }

        @media (max-width: 1280px) {
          .cards {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
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
