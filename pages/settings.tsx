import { useEffect, useState } from "react";
import auth0 from "../lib/auth0";
import { PageLayout } from "../components/organisms/PageLayout";
import { TabStrip } from "../components/atoms/TabStrip";
import { AccountCard } from "../features/settings/components/AccountCard";
import { CurrencyCard } from "../features/settings/components/CurrencyCard";
import { PreferencesCard } from "../features/settings/components/PreferencesCard";
import { SetupCard } from "../features/settings/components/SetupCard";
import { PrivacyCard } from "../features/settings/components/PrivacyCard";
import { AboutCard } from "../features/settings/components/AboutCard";
import { CategoriesSettings } from "../features/settings/components/CategoriesSettings";
import { TagsSettings } from "../features/settings/components/TagsSettings";
import { MethodsSettings } from "../features/settings/components/MethodsSettings";
import { AccountsSettings } from "../features/settings/components/AccountsSettings";

export const getServerSideProps = auth0.withPageAuthRequired();

type Section = "general" | "categories" | "tags" | "methods" | "accounts";
const SECTIONS: { key: Section; label: string }[] = [
  { key: "general", label: "General" },
  { key: "categories", label: "Categories" },
  { key: "tags", label: "Tags" },
  { key: "methods", label: "Payment methods" },
  { key: "accounts", label: "Accounts & pockets" },
];
const isSection = (s: string): s is Section => SECTIONS.some((x) => x.key === s);

export default function SettingsPage() {
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

  return (
    <PageLayout
      title="Settings"
      subtitle="Manage your preferences, categories, tags, and accounts."
      hideMonth
    >
      <TabStrip label="Section" tabs={SECTIONS} value={section} onChange={selectSection} />

      {section === "general" && (
        <div className="general">
          <div className="column">
            <AccountCard />
            <CurrencyCard />
            <PreferencesCard />
          </div>
          <div className="column">
            <SetupCard />
            <PrivacyCard />
            <AboutCard />
          </div>
        </div>
      )}

      {section === "categories" && <CategoriesSettings />}
      {section === "tags" && <TagsSettings />}
      {section === "methods" && <MethodsSettings />}
      {section === "accounts" && <AccountsSettings />}

      <style jsx>{`
        .general {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          align-items: start;
        }

        .column {
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-width: 0;
        }

        @media (max-width: 900px) {
          .general {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </PageLayout>
  );
}
