import type { ReactNode } from "react";
import Head from "next/head";
import { Sidebar } from "./Sidebar";
import { Badge } from "../atoms/Badge";

interface Props {
  title: string;
  currency?: string;
  /** Interactive replacement for the static currency badge (display-currency switcher). */
  currencyControl?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}

export function PageLayout({ title, currency, currencyControl, actions, children }: Props) {
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
              {currencyControl ?? (currency && <Badge label={currency} />)}
            </div>
            {actions && <div className="header-actions">{actions}</div>}
          </header>

          <main className="main">{children}</main>
        </div>
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
          padding: 24px 28px;
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
