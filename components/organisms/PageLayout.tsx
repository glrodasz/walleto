import type { ReactNode } from "react";
import Head from "next/head";
import { Sidebar } from "./Sidebar";
import { CurrencySelector } from "../molecules/CurrencySelector";
import { CreateLauncher } from "../../features/create/components/CreateLauncher";
import { useMoneyContext } from "../../hooks/useMoneyContext";
import type { Domain } from "../../types";

interface Props {
  title: string;
  actions?: ReactNode;
  /** The page's domain, so the mobile create button skips the domain question. */
  domain?: Domain;
  children: ReactNode;
}

/**
 * The app shell. It is the one place a shared organism composes a feature:
 * the mobile create launcher must exist on every page, and every page is
 * built on this layout.
 */
export function PageLayout({ title, actions, domain, children }: Props) {
  // The display currency is a property of the whole app, so its switcher
  // lives in every page header, not only on the dashboard.
  const { target, setDisplayCurrency } = useMoneyContext();
  return (
    <>
      <Head>
        <title>{title} — Waletto</title>
        <meta name="theme-color" content="#0A0A0F" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="app">
        <Sidebar />

        <div className="content">
          <header className="header">
            <div className="header-left">
              <h1 className="page-title">{title}</h1>
              <CurrencySelector value={target} onChange={setDisplayCurrency} />
            </div>
            {actions && <div className="header-actions">{actions}</div>}
          </header>

          <main className="main">{children}</main>
        </div>

        <CreateLauncher domain={domain} />
      </div>

      <style jsx>{`
        .app {
          display: flex;
          min-height: 100vh;
          background: var(--bg-0);
        }

        .content {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 28px;
          border-bottom: 1px solid var(--line);
          gap: 12px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .page-title {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--fg-0);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .header-actions {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }

        .main {
          padding: 24px 28px 96px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        @media (max-width: 767px) {
          .header {
            padding: 14px 16px;
          }

          .page-title {
            font-size: 1rem;
          }

          .header-actions {
            display: none;
          }

          .main {
            padding: 16px;
            /* Clear the fixed bottom nav (64px + safe area) and the floating
               create button above it, so the last row is never hidden. */
            padding-bottom: calc(140px + env(safe-area-inset-bottom, 0px));
          }
        }
      `}</style>
    </>
  );
}
