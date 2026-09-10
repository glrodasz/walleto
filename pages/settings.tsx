import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useUser } from "@auth0/nextjs-auth0/client";
import auth0 from "../lib/auth0";
import { PageLayout } from "../components/organisms/PageLayout";
import { Card } from "../components/atoms/Card";
import { SectionTitle } from "../components/atoms/SectionTitle";
import { Button } from "../components/atoms/Button";
import { Select } from "../components/atoms/Select";
import { TabStrip } from "../components/atoms/TabStrip";
import { useUserDoc } from "../hooks/useUserDoc";
import { CategoriesSettings } from "../features/settings/components/CategoriesSettings";
import { AccountsSettings } from "../features/settings/components/AccountsSettings";
import { TagsSettings } from "../features/settings/components/TagsSettings";
import { SELECTABLE_CURRENCIES, CURRENCY_SYMBOL } from "../constants";
import type { Currency } from "../types";

export const getServerSideProps = auth0.withPageAuthRequired();

const CURRENCY_OPTIONS = SELECTABLE_CURRENCIES.map((c) => ({
  value: c.value,
  label: `${CURRENCY_SYMBOL[c.value]} ${c.label}`,
}));

type Section = "general" | "categories" | "tags" | "accounts";
const SECTIONS: { key: Section; label: string }[] = [
  { key: "general", label: "General" },
  { key: "categories", label: "Categories" },
  { key: "tags", label: "Tags" },
  { key: "accounts", label: "Accounts & pockets" },
];
const isSection = (s: string): s is Section => SECTIONS.some((x) => x.key === s);

export default function SettingsPage() {
  const { user } = useUser();
  const router = useRouter();
  const { userDoc, update } = useUserDoc();
  const [busy, setBusy] = useState(false);
  const [savingCurrency, setSavingCurrency] = useState(false);
  // The section lives in the URL hash (#tags) so a reload or a link lands
  // on it; only the active section mounts, so its listeners run while shown.
  const [section, setSection] = useState<Section>("general");
  useEffect(() => {
    const fromHash = window.location.hash.slice(1);
    if (isSection(fromHash)) setSection(fromHash);
  }, []);
  const selectSection = (key: string) => {
    if (!isSection(key)) return;
    setSection(key);
    const base = window.location.pathname + window.location.search;
    window.history.replaceState(null, "", key === "general" ? base : `${base}#${key}`);
  };

  const changeMainCurrency = async (currency: string) => {
    setSavingCurrency(true);
    try {
      await update({ mainCurrency: currency as Currency });
    } catch (err) {
      console.error("Failed to update main currency:", err);
    } finally {
      setSavingCurrency(false);
    }
  };

  const redoOnboarding = async () => {
    setBusy(true);
    try {
      // Fills in any defaults added since this account was created. Idempotent,
      // so nothing the user already has is touched or duplicated.
      const res = await fetch("/api/categories/defaults", { method: "POST" });
      if (!res.ok) throw new Error(await res.text());

      await update({ onboardingCompleted: false });
      router.push("/onboarding/categories");
    } catch (err) {
      console.error("Failed to restart onboarding:", err);
      setBusy(false);
    }
  };

  return (
    <PageLayout title="Settings">
      <div className="column">
        <TabStrip label="Section" tabs={SECTIONS} value={section} onChange={selectSection} />

        {section === "general" && (
          <>
            <Card>
              <SectionTitle title="Account" />
              <ul className="rows">
                <li className="row">
                  <span className="label">Name</span>
                  <span className="value">{user?.name ?? "—"}</span>
                </li>
                <li className="row">
                  <span className="label">Email</span>
                  <span className="value">{user?.email ?? "—"}</span>
                </li>
              </ul>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/api/auth/logout" className="logout">
                Log out
              </a>
            </Card>

            <Card>
              <SectionTitle title="Currency" />
              <p className="hint">
                Your main currency for reporting. Amounts always stay in the currency they were
                entered in — this only controls the default target for totals.
              </p>
              <div className="currency-field">
                <Select
                  aria-label="Main currency"
                  options={CURRENCY_OPTIONS}
                  value={userDoc?.mainCurrency ?? ""}
                  disabled={savingCurrency || !userDoc}
                  onValueChange={changeMainCurrency}
                />
              </div>
            </Card>

            <Card>
              <SectionTitle title="Setup" />
              <p className="hint">
                Re-run the assisted setup to review your categories, payment methods, and recurring
                incomes and expenses.
              </p>
              <div className="redo">
                <Button variant="secondary" size="sm" onClick={redoOnboarding} disabled={busy}>
                  {busy ? "Starting…" : "Redo onboarding"}
                </Button>
              </div>
            </Card>
          </>
        )}

        {section === "categories" && <CategoriesSettings />}
        {section === "tags" && <TagsSettings />}
        {section === "accounts" && <AccountsSettings />}
      </div>

      <style jsx>{`
        /* One readable column; the section strip decides what is in it. */
        .column {
          width: 100%;
          max-width: 720px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .rows {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .label {
          font-size: 0.85rem;
          color: var(--fg-2);
        }

        .value {
          font-size: 0.85rem;
          color: var(--fg-0);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .hint {
          margin: 0;
          font-size: 0.85rem;
          color: var(--fg-1);
        }

        .redo {
          margin-top: 4px;
        }

        .currency-field {
          max-width: 200px;
        }

        .logout {
          margin-top: 4px;
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
    </PageLayout>
  );
}
