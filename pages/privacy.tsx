import Head from "next/head";
import Link from "next/link";
import { ChevronLeft, Shield } from "../components/atoms/Icons";
import { Card } from "../components/atoms/Card";
import { INTL_LOCALE } from "../helpers/i18n";
import { usePreferences } from "../hooks/usePreferences";
import { useT } from "../hooks/useT";
import { PAGE_MESSAGES } from "../messages/pages";
import { splitEmphasis } from "../utils/emphasis";

const LAST_UPDATED = new Date(2026, 8, 26);

type PageKey = keyof (typeof PAGE_MESSAGES)["en"];

/**
 * A sentence whose lead-in is bold ("**Preferences** — …"), from one
 * translated string. Only inline runs: the `<li>` stays in the page's JSX so
 * its scoped styles apply.
 */
function Emphasis({ text }: { text: string }) {
  return (
    <>
      {splitEmphasis(text).map((part, n) =>
        part.strong ? <strong key={n}>{part.text}</strong> : <span key={n}>{part.text}</span>
      )}
    </>
  );
}

export default function Privacy() {
  const support = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "walleto@guillermorodas.com";
  const { language } = usePreferences();
  const t = useT(PAGE_MESSAGES);
  const updated = new Intl.DateTimeFormat(INTL_LOCALE[language], { dateStyle: "long" }).format(
    LAST_UPDATED
  );
  const simple: [PageKey, PageKey][] = [
    ["privacy.use.title", "privacy.use.body"],
    ["privacy.storage.title", "privacy.storage.body"],
    ["privacy.thirdParty.title", "privacy.thirdParty.body"],
  ];
  const closing: [PageKey, PageKey][] = [
    ["privacy.rights.title", "privacy.rights.body"],
    ["privacy.children.title", "privacy.children.body"],
    ["privacy.changes.title", "privacy.changes.body"],
  ];
  const subject = encodeURIComponent(t("privacy.retention.subject"));

  return (
    <>
      <Head>
        <title>{t("privacy.title")}</title>
      </Head>
      <main className="wrap">
        <div className="page">
          <Link className="back" href="/">
            <ChevronLeft size={16} /> {t("privacy.back")}
          </Link>
          <Card>
            <header className="head">
              <Shield size={22} />
              <div>
                <h1 className="title">{t("privacy.heading")}</h1>
                <p className="updated">{t("privacy.updated", { date: updated })}</p>
              </div>
            </header>

            <section className="section">
              <h2>{t("privacy.overview.title")}</h2>
              <p>{t("privacy.overview.body")}</p>
            </section>

            <section className="section">
              <h2>{t("privacy.collect.title")}</h2>
              <p>{t("privacy.collect.intro")}</p>
              <ul>
                <li>
                  <Emphasis text={t("privacy.collect.account")} />
                </li>
                <li>
                  <Emphasis text={t("privacy.collect.financial")} />
                </li>
                <li>
                  <Emphasis text={t("privacy.collect.preferences")} />
                </li>
              </ul>
            </section>

            {simple.map(([title, body]) => (
              <section className="section" key={title}>
                <h2>{t(title)}</h2>
                <p>{t(body)}</p>
              </section>
            ))}

            <section className="section">
              <h2>{t("privacy.retention.title")}</h2>
              <p>
                {t("privacy.retention.before")}{" "}
                <a href={`mailto:${support}?subject=${subject}`}>{support}</a>
                {t("privacy.retention.after")}
              </p>
            </section>

            {closing.map(([title, body]) => (
              <section className="section" key={title}>
                <h2>{t(title)}</h2>
                <p>{t(body)}</p>
              </section>
            ))}

            <section className="section">
              <h2>{t("privacy.contact.title")}</h2>
              <p>
                {t("privacy.contact.before")} <a href={`mailto:${support}`}>{support}</a>
                {t("privacy.contact.after")}
              </p>
            </section>
          </Card>
        </div>
      </main>
      <style jsx>{`
        .wrap {
          min-height: 100%;
          display: flex;
          justify-content: center;
          padding: 32px 20px 48px;
        }

        .page {
          max-width: 720px;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .back {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          align-self: flex-start;
          color: var(--fg-1);
          font-size: 0.85rem;
          font-weight: 600;
        }

        .head {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .title {
          margin: 0;
          font-size: 1.4rem;
        }

        .updated {
          margin: 2px 0 0;
          color: var(--fg-2);
          font-size: 0.8rem;
        }

        .section {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .section h2 {
          margin: 0;
          font-size: 1rem;
        }

        .section p,
        .section li {
          margin: 0;
          color: var(--fg-1);
          font-size: 0.9rem;
          line-height: 1.55;
        }

        .section ul {
          margin: 0;
          padding-left: 20px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .section a {
          color: var(--accent);
        }
      `}</style>
    </>
  );
}
