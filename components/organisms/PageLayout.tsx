import type { ReactNode } from "react";
import Head from "next/head";
import { Sidebar } from "./Sidebar";
import { CurrencySelector } from "../molecules/CurrencySelector";
import { MonthPicker } from "../molecules/MonthPicker";
import { CreateLauncher } from "../../features/create/components/CreateLauncher";
import { useMoneyContext } from "../../hooks/useMoneyContext";
import { useSelectedMonth } from "../../hooks/useSelectedMonth";
import type { Domain } from "../../types";

interface Props {
  title: string;
  /** One line under the title saying what the page is for. */
  subtitle?: string;
  /** The page's domain, so the create button skips the domain question. */
  domain?: Domain;
  /** Pages with no money on them skip the display-currency switcher. */
  hideCurrency?: boolean;
  /** Pages that are not about one month (Settings) skip the month picker. */
  hideMonth?: boolean;
  children: ReactNode;
}

/**
 * The app shell. It is the one place a shared organism composes a feature:
 * the mobile create launcher must exist on every page, and every page is
 * built on this layout.
 */
export function PageLayout({ title, subtitle, domain, hideCurrency, hideMonth, children }: Props) {
  // The display currency and the selected month are properties of the whole
  // app, so their controls live in every page header, not only on the dashboard.
  const { target, setDisplayCurrency } = useMoneyContext();
  const month = useSelectedMonth();
  return (
    <>
      <Head>
        <title>{title} — Waletto</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="app">
        <Sidebar />

        <div className="content">
          <header className="header">
            <div className="heading">
              <h1 className="page-title">{title}</h1>
              {subtitle && <p className="subtitle">{subtitle}</p>}
            </div>
            {(!hideCurrency || !hideMonth) && (
              <div className="controls">
                {!hideCurrency && <CurrencySelector value={target} onChange={setDisplayCurrency} />}
                {!hideMonth && (
                  <MonthPicker
                    value={month.selectedKey}
                    windows={month.pickerWindows}
                    onChange={month.select}
                    onStep={month.step}
                  />
                )}
              </div>
            )}
          </header>

          <main className="main">{children}</main>
        </div>

        <CreateLauncher domain={domain} />
      </div>

      <style jsx>{`
        .app {
          display: flex;
          min-height: 100vh;
        }

        .content {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding: 32px 32px 8px;
        }

        .heading {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }

        .page-title {
          margin: 0;
          font-size: 1.9rem;
          font-weight: 700;
          letter-spacing: -0.03em;
          color: var(--fg-0);
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .subtitle {
          margin: 0;
          font-size: 0.95rem;
          color: var(--fg-1);
        }

        .controls {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .main {
          padding: 16px 32px 96px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        @media (max-width: 767px) {
          .header {
            flex-direction: column;
            align-items: stretch;
            padding: 20px 16px 4px;
          }

          .page-title {
            font-size: 1.5rem;
          }

          .subtitle {
            font-size: 0.85rem;
          }

          .controls {
            flex-wrap: wrap;
          }

          .main {
            padding: 12px 16px;
            /* Clear the fixed bottom nav (64px + safe area) and the floating
               create button above it, so the last row is never hidden. */
            padding-bottom: calc(140px + env(safe-area-inset-bottom, 0px));
          }
        }
      `}</style>
    </>
  );
}
