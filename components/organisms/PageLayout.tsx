import { useRef } from "react";
import type { ReactNode } from "react";
import Head from "next/head";
import { Sidebar } from "./Sidebar";
import { CurrencySelector } from "../molecules/CurrencySelector";
import { PrivacyToggle } from "../molecules/PrivacyToggle";
import { MonthPicker } from "../molecules/MonthPicker";
import { CreateLauncher } from "../../features/create/components/CreateLauncher";
import { ScenarioBar } from "./ScenarioBar";
import { useMoneyContext } from "../../hooks/useMoneyContext";
import { useSelectedMonth } from "../../hooks/useSelectedMonth";
import { useIsStuck } from "../../hooks/useIsStuck";
import { useT } from "../../hooks/useT";
import { NAVIGATION_MESSAGES } from "../../messages/navigation";
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
  /** Pages whose figures follow the Best / Average / Worst choice show its picker. */
  scenario?: boolean;
  children: ReactNode;
}

/**
 * The app shell. It is the one place a shared organism composes a feature:
 * the mobile create launcher must exist on every page, and every page is
 * built on this layout.
 */
export function PageLayout({
  title,
  subtitle,
  domain,
  hideCurrency,
  hideMonth,
  scenario,
  children,
}: Props) {
  // Privacy mode, the display currency and the selected month are properties
  // of the whole app, so their controls live in every page header, not only on
  // the dashboard. They stay pinned to the top while the page scrolls, on one
  // line, and only turn into a glass bar once something scrolls under them.
  const { target, setDisplayCurrency } = useMoneyContext();
  const month = useSelectedMonth();
  const t = useT(NAVIGATION_MESSAGES);
  const controlsRef = useRef<HTMLDivElement>(null);
  const stuck = useIsStuck(controlsRef);
  return (
    <>
      <Head>
        <title>{t("page.title", { title })}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="app">
        <Sidebar />

        <div className="content">
          <header className="header">
            <h1 className="page-title">{title}</h1>
            {subtitle && <p className="subtitle">{subtitle}</p>}
          </header>

          <div
            ref={controlsRef}
            className={`controls${stuck ? " glass glass--strong glass--raised is-stuck" : ""}`}
          >
            <PrivacyToggle />
            {!hideCurrency && <CurrencySelector value={target} onChange={setDisplayCurrency} />}
            {scenario && <ScenarioBar />}
            {!hideMonth && (
              <div className="month">
                <MonthPicker
                  value={month.selectedKey}
                  windows={month.pickerWindows}
                  onChange={month.select}
                  onStep={month.step}
                />
              </div>
            )}
          </div>

          <main className="main">{children}</main>
        </div>

        <CreateLauncher domain={domain} />
      </div>

      <style jsx>{`
        .app {
          display: flex;
          min-height: 100vh;
        }

        /* Two columns on desktop: the title on the left, the controls on the
           right of its line. The controls span the page's whole height so
           their sticky offset holds all the way down, not just over the
           title's row. */
        .content {
          flex: 1;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          grid-template-rows: auto 1fr;
          align-content: start;
          min-width: 0;
        }

        .header {
          grid-column: 1;
          grid-row: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
          padding: 32px 16px 8px 32px;
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

        /* The bar's padding and border are there at rest too, transparent,
           so turning into glass never moves a control. */
        .controls {
          grid-column: 2;
          grid-row: 1 / -1;
          align-self: start;
          position: sticky;
          top: 12px;
          z-index: 20;
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 26px 26px 0 0;
          padding: 5px;
          border: 1px solid transparent;
          border-radius: calc(var(--r-md) + 6px);
          transition:
            background-color 150ms ease,
            box-shadow 150ms ease;
        }

        .controls.is-stuck {
          border-color: var(--glass-rim);
        }

        .main {
          grid-column: 1 / -1;
          grid-row: 2;
          min-width: 0;
          padding: 16px 32px 96px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        @media (max-width: 767px) {
          .content {
            display: flex;
            flex-direction: column;
          }

          .header {
            padding: 20px 16px 4px;
          }

          .page-title {
            font-size: 1.5rem;
          }

          .subtitle {
            font-size: 0.85rem;
          }

          /* Under the title, full width, on one line. */
          .controls {
            align-self: stretch;
            top: calc(8px + env(safe-area-inset-top, 0px));
            gap: 6px;
            margin: 6px 10px 0;
          }

          /* The month picker takes the right end of the row. */
          .month {
            margin-left: auto;
          }

          .main {
            padding: 12px 16px;
            /* Clear the fixed bottom nav (64px + safe area) and the floating
               create button above it, so the last row is never hidden. */
            padding-bottom: calc(140px + env(safe-area-inset-bottom, 0px));
          }
        }

        /* Phones up to ~420px can't fit four controls and the month's step
           arrows: with the scenario pill there, the month is picked from
           its list alone. */
        @media (max-width: 419px) {
          :global(:has(> [data-scenario-picker])) > .month :global(.arrow) {
            display: none;
          }
        }

        /* Narrow phones scroll the row sideways rather than widen the page
           when the longest pick ("Promedio") doesn't fit. */
        @media (max-width: 379px) {
          .controls {
            gap: 4px;
            overflow-x: auto;
            scrollbar-width: none;
          }

          .controls::-webkit-scrollbar {
            display: none;
          }
        }
      `}</style>
    </>
  );
}
