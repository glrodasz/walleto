import Head from "next/head";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Language } from "../../../types";
import { translator } from "../../../helpers/i18n";
import { GITHUB_REPO_URL } from "../../../constants";
import { IconDisc } from "../../../components/molecules/IconDisc";
import {
  ArrowRight,
  Check,
  Coins,
  EyeOff,
  Globe,
  Landmark,
  Lifebuoy,
  Moon,
  Piggy,
  Repeat,
  Shield,
  Shuffle,
  Tag,
  TrendingUp,
  Home,
  Heart,
} from "../../../components/atoms/Icons";
import { LANDING_MESSAGES } from "../messages";
import { LANDING_PATH, signUpHref } from "../routes";
import { ogImageSrc } from "../data/shots";
import type { ShotId } from "../data/shots";
import { LandingNav } from "./LandingNav";
import { FeatureRow } from "./FeatureRow";
import { LandingFaq } from "./LandingFaq";
import { LandingFooter } from "./LandingFooter";
import { Shot } from "./Shot";

interface Props {
  language: Language;
  /** Scheme and host of this request, for the canonical, hreflang and og:image URLs. */
  origin: string;
  signedIn?: boolean;
}

type FeatureId = "plan" | "checklist" | "variable" | "currency" | "worth" | "prospect";

const FEATURES: { id: FeatureId; color: string; icon: ReactNode }[] = [
  { id: "plan", color: "var(--accent)", icon: <Home size={16} /> },
  { id: "checklist", color: "var(--domain-income)", icon: <Check size={16} /> },
  { id: "variable", color: "var(--domain-expense)", icon: <Shuffle size={16} /> },
  { id: "currency", color: "var(--domain-saving)", icon: <Coins size={16} /> },
  { id: "worth", color: "var(--domain-investment)", icon: <TrendingUp size={16} /> },
  { id: "prospect", color: "var(--domain-debt)", icon: <Lifebuoy size={16} /> },
];

const PROBLEMS = [
  { id: "1", icon: <Repeat size={20} />, color: "var(--domain-expense)" },
  { id: "2", icon: <Piggy size={20} />, color: "var(--domain-saving)" },
  { id: "3", icon: <Globe size={20} />, color: "var(--domain-investment)" },
] as const;

const EXTRAS = [
  { id: "organize", icon: <Tag size={20} /> },
  { id: "privacy", icon: <EyeOff size={20} /> },
  { id: "theme", icon: <Moon size={20} /> },
  { id: "language", icon: <Globe size={20} /> },
] as const;

const TRUST = [
  { id: "bank", icon: <Landmark size={20} /> },
  { id: "ads", icon: <Heart size={20} /> },
  { id: "auth", icon: <Shield size={20} /> },
] as const;

const OG_LOCALE: Record<Language, string> = { en: "en_US", es: "es_ES" };

/**
 * The public front door: what someone gets when they create an account,
 * told with screenshots of the real app. `/` shows it to signed-out
 * visitors; /en and /es pin a language for search engines and shared links.
 */
export function LandingPage({ language, origin, signedIn = false }: Props) {
  const t = translator(LANDING_MESSAGES, language);
  const url = (path: string) => `${origin}${path}`;

  return (
    <>
      <Head>
        <title>{t("meta.title")}</title>
        <meta key="description" name="description" content={t("meta.description")} />
        <link rel="canonical" href={url(LANDING_PATH[language])} />
        <link rel="alternate" hrefLang="en" href={url(LANDING_PATH.en)} />
        <link rel="alternate" hrefLang="es" href={url(LANDING_PATH.es)} />
        <link rel="alternate" hrefLang="x-default" href={url("/")} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Walleto" />
        <meta property="og:title" content={t("meta.title")} />
        <meta property="og:description" content={t("meta.description")} />
        <meta property="og:url" content={url(LANDING_PATH[language])} />
        <meta property="og:image" content={url(ogImageSrc(language))} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content={OG_LOCALE[language]} />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <div className="landing">
        <LandingNav language={language} signedIn={signedIn} />

        <main>
          <section className="hero">
            <div className="hero-copy">
              <p className="pill">{t("hero.eyebrow")}</p>
              <h1>{t("hero.title")}</h1>
              <p className="lead">{t("hero.subtitle")}</p>
              <div className="ctas">
                {signedIn ? (
                  <Link className="btn btn--primary" href="/">
                    {t("nav.openApp")} <ArrowRight size={18} />
                  </Link>
                ) : (
                  <a className="btn btn--primary" href={signUpHref(language)}>
                    {t("hero.cta")} <ArrowRight size={18} />
                  </a>
                )}
                <a className="btn btn--ghost" href="#how">
                  {t("hero.secondary")}
                </a>
              </div>
              <ul className="badges">
                {(["bank", "currencies", "languages"] as const).map((id) => (
                  <li key={id}>
                    <Check size={16} /> {t(`hero.trust.${id}`)}
                  </li>
                ))}
              </ul>
            </div>
            <div className="hero-shots">
              <Shot
                id="hero"
                language={language}
                alt={t("hero.shot")}
                sizes="(max-width: 1099px) 100vw, 1100px"
                priority
                className="hero-desktop"
              />
              <Shot
                id="hero-mobile"
                language={language}
                alt={t("hero.shotMobile")}
                sizes="220px"
                priority
                className="hero-phone"
              />
            </div>
          </section>

          <section className="section" aria-labelledby="problem-title">
            <h2 id="problem-title" className="section-title narrow">
              {t("problem.title")}
            </h2>
            <div className="grid grid--3">
              {PROBLEMS.map(({ id, icon, color }) => (
                <div key={id} className="tile glass">
                  <IconDisc color={color}>{icon}</IconDisc>
                  <h3>{t(`problem.${id}.title`)}</h3>
                  <p>{t(`problem.${id}.body`)}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="how" className="section" aria-labelledby="how-title">
            <h2 id="how-title" className="section-title">
              {t("how.title")}
            </h2>
            <ol className="grid grid--3 steps">
              {(["1", "2", "3"] as const).map((id) => (
                <li key={id} className="tile glass">
                  <span className="step-number" aria-hidden="true">
                    {id}
                  </span>
                  <h3>{t(`how.${id}.title`)}</h3>
                  <p>{t(`how.${id}.body`)}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="section" aria-labelledby="features-title">
            <h2 id="features-title" className="section-title">
              {t("features.title")}
            </h2>
            <div className="features">
              {FEATURES.map(({ id, color, icon }, index) => (
                <FeatureRow
                  key={id}
                  eyebrow={t(`features.${id}.eyebrow`)}
                  title={t(`features.${id}.title`)}
                  body={t(`features.${id}.body`)}
                  shot={id satisfies ShotId}
                  shotAlt={t(`features.${id}.shot`)}
                  language={language}
                  color={color}
                  icon={icon}
                  flip={index % 2 === 1}
                />
              ))}
            </div>
          </section>

          <section className="section" aria-labelledby="extras-title">
            <h2 id="extras-title" className="section-title">
              {t("extras.title")}
            </h2>
            <div className="grid grid--4">
              {EXTRAS.map(({ id, icon }) => (
                <div key={id} className="tile glass">
                  <IconDisc>{icon}</IconDisc>
                  <h3>{t(`extras.${id}.title`)}</h3>
                  <p>{t(`extras.${id}.body`)}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="section panel glass" aria-labelledby="trust-title">
            <h2 id="trust-title" className="section-title">
              {t("trust.title")}
            </h2>
            <div className="grid grid--3">
              {TRUST.map(({ id, icon }) => (
                <div key={id} className="trust">
                  <IconDisc color="var(--positive)">{icon}</IconDisc>
                  <h3>{t(`trust.${id}.title`)}</h3>
                  <p>{t(`trust.${id}.body`)}</p>
                </div>
              ))}
            </div>
            <Link className="text-link" href="/privacy">
              {t("trust.policy")} <ArrowRight size={16} />
            </Link>
          </section>

          <section className="section source" aria-labelledby="source-title">
            <div>
              <h2 id="source-title">{t("source.title")}</h2>
              <p>{t("source.body")}</p>
            </div>
            <a className="btn btn--ghost" href={GITHUB_REPO_URL} rel="noopener">
              {t("source.cta")} <ArrowRight size={18} />
            </a>
          </section>

          <section className="section faq" aria-labelledby="faq-title">
            <h2 id="faq-title" className="section-title">
              {t("faq.title")}
            </h2>
            <LandingFaq language={language} />
          </section>

          <section className="section final" aria-labelledby="final-title">
            <h2 id="final-title">{t("final.title")}</h2>
            <p>{t("final.body")}</p>
            {signedIn ? (
              <Link className="btn btn--primary" href="/">
                {t("nav.openApp")} <ArrowRight size={18} />
              </Link>
            ) : (
              <a className="btn btn--primary" href={signUpHref(language)}>
                {t("hero.cta")} <ArrowRight size={18} />
              </a>
            )}
          </section>
        </main>

        <LandingFooter language={language} />
      </div>

      <style jsx>{`
        .landing {
          max-width: 1180px;
          margin: 0 auto;
          padding: 12px 24px 32px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        main {
          display: flex;
          flex-direction: column;
          gap: 112px;
          padding: 48px 0 32px;
        }

        /* ── Hero ─────────────────────────────────────────────────────── */
        .hero {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 56px;
        }

        .hero-copy {
          max-width: 760px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .pill {
          margin: 0 0 20px;
          padding: 6px 14px;
          border-radius: var(--r-pill);
          background: var(--accent-soft);
          color: var(--accent);
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        h1 {
          margin: 0 0 20px;
          font-size: clamp(2.4rem, 1.4rem + 4vw, 4.2rem);
          line-height: 1.04;
          letter-spacing: -0.035em;
          color: var(--fg-0);
        }

        .lead {
          margin: 0 0 32px;
          max-width: 620px;
          color: var(--fg-1);
          font-size: clamp(1.05rem, 0.95rem + 0.4vw, 1.25rem);
          line-height: 1.55;
        }

        .ctas {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 12px;
        }

        .badges {
          list-style: none;
          margin: 24px 0 0;
          padding: 0;
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px 20px;
          color: var(--fg-2);
          font-size: 0.875rem;
        }

        .badges li {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .badges li :global(svg) {
          color: var(--positive);
        }

        .hero-shots {
          position: relative;
          width: 100%;
          padding-right: 64px;
        }

        .hero-shots :global(.hero-phone) {
          position: absolute;
          right: 0;
          bottom: -32px;
          width: 22%;
          max-width: 220px;
          border-radius: 28px;
          border-width: 6px;
          border-color: var(--fg-0);
        }

        /* ── Buttons (links styled like the app's Button) ─────────────── */
        .landing :global(.btn) {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 48px;
          padding: 0 24px;
          border-radius: var(--r-pill);
          font-weight: 600;
          font-size: 1rem;
          white-space: nowrap;
          transition:
            background-color 180ms ease,
            transform 180ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .landing :global(.btn:active) {
          transform: scale(0.97);
        }

        .landing :global(.btn--primary) {
          background: var(--accent);
          color: var(--on-accent);
          box-shadow: 0 10px 24px -12px var(--accent);
        }

        .landing :global(.btn--primary:hover) {
          background: var(--accent-hover);
        }

        .landing :global(.btn--ghost) {
          background: var(--glass);
          border: 1px solid var(--glass-rim);
          color: var(--fg-0);
        }

        .landing :global(.btn--ghost:hover) {
          background: var(--glass-hover);
        }

        /* ── Sections ─────────────────────────────────────────────────── */
        .section {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .section-title {
          margin: 0;
          text-align: center;
          font-size: clamp(1.6rem, 1.2rem + 1.6vw, 2.4rem);
          line-height: 1.15;
          letter-spacing: -0.025em;
          color: var(--fg-0);
        }

        .section-title.narrow {
          max-width: 760px;
          align-self: center;
        }

        .grid {
          display: grid;
          gap: 16px;
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .grid--3 {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .grid--4 {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }

        .tile {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
          padding: 24px;
          border-radius: var(--r-xl);
        }

        .tile h3,
        .trust h3 {
          margin: 6px 0 0;
          font-size: 1.05rem;
          color: var(--fg-0);
        }

        .tile p,
        .trust p {
          margin: 0;
          color: var(--fg-1);
          line-height: 1.55;
          font-size: 0.95rem;
        }

        .step-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--accent);
          color: var(--on-accent);
          font-weight: 700;
        }

        .features {
          display: flex;
          flex-direction: column;
          gap: 88px;
        }

        .panel {
          padding: 40px;
          border-radius: var(--r-xl);
        }

        .trust {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
        }

        .landing :global(.text-link) {
          align-self: center;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--accent);
          font-weight: 600;
        }

        .source {
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          padding: 32px 40px;
          border-radius: var(--r-xl);
          border: 1px dashed var(--line-strong);
        }

        .source h2 {
          margin: 0 0 6px;
          font-size: 1.4rem;
          color: var(--fg-0);
        }

        .source p {
          margin: 0;
          max-width: 620px;
          color: var(--fg-1);
          line-height: 1.55;
        }

        .faq {
          max-width: 760px;
          width: 100%;
          align-self: center;
        }

        .final {
          align-items: center;
          text-align: center;
          gap: 16px;
        }

        .final h2 {
          margin: 0;
          font-size: clamp(1.8rem, 1.3rem + 2vw, 2.8rem);
          letter-spacing: -0.03em;
          color: var(--fg-0);
        }

        .final p {
          margin: 0 0 8px;
          color: var(--fg-1);
          font-size: 1.1rem;
        }

        @media (max-width: 899px) {
          .grid--3,
          .grid--4 {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .grid--3 > :global(:last-child:nth-child(odd)) {
            grid-column: 1 / -1;
          }

          .source {
            flex-direction: column;
            align-items: flex-start;
          }
        }

        @media (max-width: 599px) {
          .landing {
            padding: 8px 16px 24px;
          }

          main {
            gap: 72px;
            padding-top: 32px;
          }

          .hero {
            gap: 36px;
          }

          .ctas {
            flex-direction: column;
            align-self: stretch;
          }

          .hero-shots {
            padding-right: 0;
          }

          /* On a phone, the phone shot says more than a shrunken desktop. */
          .hero-shots :global(.hero-desktop) {
            display: none;
          }

          .hero-shots :global(.hero-phone) {
            position: static;
            width: 72%;
            max-width: 300px;
            margin: 0 auto;
          }

          .grid--3,
          .grid--4 {
            grid-template-columns: minmax(0, 1fr);
          }

          .panel,
          .source {
            padding: 24px 20px;
          }

          .features {
            gap: 56px;
          }
        }
      `}</style>
    </>
  );
}
