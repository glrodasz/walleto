import { useEffect, useState } from "react";
import { PageLayout } from "../../../components/organisms/PageLayout";
import { TabStrip } from "../../../components/atoms/TabStrip";
import { t } from "../../../helpers/i18n";
import { COMMON_MESSAGES } from "../../../messages/common";
import { usePreferences } from "../../../hooks/usePreferences";
import { useT } from "../../../hooks/useT";
import { SETTINGS_MESSAGES } from "../messages";
import { AccountCard } from "./AccountCard";
import { CurrencyCard } from "./CurrencyCard";
import { PreferencesCard } from "./PreferencesCard";
import { SetupCard } from "./SetupCard";
import { PrivacyCard } from "./PrivacyCard";
import { AboutCard } from "./AboutCard";
import { CategoriesSettings } from "./CategoriesSettings";
import { TagsSettings } from "./TagsSettings";
import { MethodsSettings } from "./MethodsSettings";
import { AccountsSettings } from "./AccountsSettings";

type Section = "general" | "categories" | "tags" | "methods" | "accounts";
const SECTIONS: Section[] = ["general", "categories", "tags", "methods", "accounts"];
const isSection = (s: string): s is Section => (SECTIONS as string[]).includes(s);

export function SettingsPage() {
  // The section lives in the URL hash (#tags) so a reload or a link lands
  // on it; only the active section mounts, so its listeners run while shown.
  const [section, setSection] = useState<Section>("general");
  const { language } = usePreferences();
  const tr = useT(SETTINGS_MESSAGES);
  const tc = useT(COMMON_MESSAGES);
  const labels: Record<Section, string> = {
    general: t("settings.general.title", language),
    categories: tc("noun.categories"),
    tags: tc("noun.tags"),
    methods: tc("noun.paymentMethods"),
    accounts: tr("section.accounts"),
  };
  const tabs = SECTIONS.map((key) => ({ key, label: labels[key] }));
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
    <PageLayout title={tr("page.title")} subtitle={tr("page.subtitle")} hideMonth>
      <TabStrip label={tr("page.sections")} tabs={tabs} value={section} onChange={selectSection} />

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
