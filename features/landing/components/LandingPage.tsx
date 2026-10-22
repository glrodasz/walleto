import Head from "next/head";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Language } from "../../../types";
import { translator } from "../../../helpers/i18n";
import { GITHUB_REPO_URL } from "../../../constants";
import {
  ArrowRight,
  Chart,
  Check,
  Coins,
  Compass,
  EyeOff,
  Globe,
  Heart,
  Home,
  Landmark,
  Moon,
  Repeat,
  Rocket,
  Shield,
  Shuffle,
  Tag,
  TrendingUp,
} from "../../../components/atoms/Icons";
import { LANDING_MESSAGES } from "../messages";
import { LANDING_PATH, ogImageSrc, signInHref } from "../routes";
import { LandingNav } from "./LandingNav";
import { FeatureRow } from "./FeatureRow";
import { LandingFaq } from "./LandingFaq";
import { LandingFooter } from "./LandingFooter";
import { HeroArt } from "./art/HeroArt";
import { ProblemArt } from "./art/ProblemArt";
import { FeatureArt } from "./art/FeatureArt";
import type { FeatureId } from "./art/FeatureArt";

interface Props {
  language: Language;
  /** Scheme and host of this request, for the canonical, hreflang and og:image URLs. */
  origin: string;
  signedIn?: boolean;
}

/** Each feature wears the icon and colour it has inside the app. */
const FEATURES: { id: FeatureId; color: string; icon: ReactNode }[] = [
  { id: "plan", color: "var(--accent)", icon: <Home size={18} /> },
  { id: "checklist", color: "var(--domain-income)", icon: <Check size={18} /> },
  { id: "variable", color: "var(--domain-expense)", icon: <Shuffle size={18} /> },
  { id: "currency", color: "var(--domain-saving)", icon: <Coins size={18} /> },
  { id: "worth", color: "var(--domain-investment)", icon: <TrendingUp size={18} /> },
  { id: "prospect", color: "var(--domain-debt)", icon: <Compass size={18} /> },
];

const STEPS = [
  { id: "1", icon: <Rocket size={20} /> },
  { id: "2", icon: <Repeat size={20} /> },
  { id: "3", icon: <Chart size={20} /> },
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
 * told with drawings of the app rather than screenshots. `/` shows it to
 * signed-out visitors; /en and /es pin a language for search engines and
 * shared links.
 */
export function LandingPage({ language, origin, signedIn = false }: Props) {
  const t = translator(LANDING_MESSAGES, language);
  const url = (path: string) => `${origin}${path}`;

  const primaryCta = (className: string) =>
    signedIn ? (
      <Link className={className} href="/">
        {t("nav.openApp")} <ArrowRight size={18} />
      </Link>
    ) : (
      <a className={className} href={signInHref(language)}>
        {t("nav.signIn")} <ArrowRight size={18} />
      </a>
    );

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
                {primaryCta("btn btn--primary")}
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
            <HeroArt language={language} label={t("hero.art")} />
          </section>

          <section className="section" aria-labelledby="problem-title">
            <header className="head">
              <p className="eyebrow">{t("problem.eyebrow")}</p>
              <h2 id="problem-title">
                {t("problem.title")} <span className="muted">{t("problem.titleMuted")}</span>
              </h2>
            </header>
            <div className="grid grid--3">
              {(["1", "2", "3"] as const).map((id) => (
                <div key={id} className="tile glass">
                  <ProblemArt id={id} />
                  <h3>{t(`problem.${id}.title`)}</h3>
                  <p>{t(`problem.${id}.body`)}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="how" className="band" aria-labelledby="how-title">
            <header className="head">
              <p className="eyebrow">{t("how.eyebrow")}</p>
              <h2 id="how-title">{t("how.title")}</h2>
            </header>
            <ol className="steps">
              {STEPS.map(({ id, icon }) => (
                <li key={id}>
                  <p className="step-mark" aria-hidden="true">
                    <span className="step-icon">{icon}</span>
                    <span className="step-number">{id.padStart(2, "0")}</span>
                  </p>
                  <h3>{t(`how.${id}.title`)}</h3>
                  <p>{t(`how.${id}.body`)}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="section" aria-labelledby="features-title">
            <header className="head">
              <p className="eyebrow">{t("features.eyebrow")}</p>
              <h2 id="features-title">{t("features.title")}</h2>
            </header>
            <div className="features">
              {FEATURES.map(({ id, color, icon }, index) => (
                <FeatureRow
                  key={id}
                  eyebrow={t(`features.${id}.eyebrow`)}
                  title={t(`features.${id}.title`)}
                  body={t(`features.${id}.body`)}
                  color={color}
                  icon={icon}
                  art={
                    <FeatureArt
                      id={id}
                      language={language}
                      color={color}
                      tilt={index % 2 === 1 ? -2 : 2}
                    />
                  }
                  flip={index % 2 === 1}
                />
              ))}
            </div>
          </section>

          <section className="section" aria-labelledby="extras-title">
            <header className="head">
              <p className="eyebrow">{t("extras.eyebrow")}</p>
              <h2 id="extras-title">{t("extras.title")}</h2>
            </header>
            <div className="grid grid--4">
              {EXTRAS.map(({ id, icon }) => (
                <div key={id} className="tile glass">
                  <span className="square" aria-hidden="true">
                    {icon}
                  </span>
                  <h3>{t(`extras.${id}.title`)}</h3>
                  <p>{t(`extras.${id}.body`)}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="trust glass" aria-labelledby="trust-title">
            <div className="trust-head">
              <p className="eyebrow">{t("trust.eyebrow")}</p>
              <h2 id="trust-title">{t("trust.title")}</h2>
              <Link className="text-link" href="/privacy">
                {t("trust.policy")} <ArrowRight size={16} />
              </Link>
            </div>
            <ul className="trust-list">
              {TRUST.map(({ id, icon }) => (
                <li key={id}>
                  <span className="square square--positive" aria-hidden="true">
                    {icon}
                  </span>
                  <div>
                    <h3>{t(`trust.${id}.title`)}</h3>
                    <p>{t(`trust.${id}.body`)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="source" aria-labelledby="source-title">
            <div>
              <p className="prompt" aria-hidden="true">
                <span>$</span> git clone walleto
              </p>
              <h2 id="source-title">{t("source.title")}</h2>
              <p>{t("source.body")}</p>
            </div>
            <a className="btn btn--light" href={GITHUB_REPO_URL} rel="noopener">
              {t("source.cta")} <ArrowRight size={18} />
            </a>
          </section>

          <section className="section faq" aria-labelledby="faq-title">
            <header className="head">
              <h2 id="faq-title">{t("faq.title")}</h2>
            </header>
            <LandingFaq language={language} />
          </section>

          <section className="final" aria-labelledby="final-title">
            <h2 id="final-title">{t("final.title")}</h2>
            <p>{t("final.body")}</p>
            {primaryCta("btn btn--light")}
          </section>
        </main>

        <LandingFooter language={language} />
      </div>

      <style jsx>{`
        .landing {
          /* The dark bands keep their night colours in either theme. */
          --ink: #0b1020;
          --ink-fg: #f1f5f9;
          --ink-muted: #94a3b8;
          --ink-line: rgba(255, 255, 255, 0.12);

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
          gap: 128px;
          padding: 56px 0 32px;
        }

        /* ── Hero ─────────────────────────────────────────────────────── */
        .hero {
          display: grid;
          grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
          align-items: center;
          gap: 48px;
        }

        .hero-copy {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .pill {
          margin: 0 0 24px;
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
          margin: 0 0 24px;
          font-size: clamp(2.8rem, 1rem + 4.4vw, 4.9rem);
          line-height: 0.98;
          letter-spacing: -0.045em;
          color: var(--fg-0);
        }

        .lead {
          margin: 0 0 36px;
          max-width: 26ch;
          color: var(--fg-1);
          font-size: clamp(1.25rem, 1rem + 0.8vw, 1.6rem);
          line-height: 1.35;
          letter-spacing: -0.01em;
        }

        .ctas {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .badges {
          list-style: none;
          margin: 28px 0 0;
          padding: 0;
          display: flex;
          flex-wrap: wrap;
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

        /* White on the dark and accent panels; the label takes the accent. */
        .landing :global(.btn--light) {
          background: #fff;
          color: var(--accent);
          box-shadow: 0 12px 28px -14px rgba(15, 23, 42, 0.6);
        }

        .landing :global(.btn--light:hover) {
          background: #f1f5f9;
        }

        /* ── Section heads ────────────────────────────────────────────── */
        .section {
          display: flex;
          flex-direction: column;
          gap: 48px;
        }

        .head {
          display: flex;
          flex-direction: column;
          gap: 14px;
          max-width: 760px;
        }

        .eyebrow {
          margin: 0;
          color: var(--accent);
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .head h2,
        .trust-head h2 {
          margin: 0;
          font-size: clamp(1.9rem, 1.3rem + 2.2vw, 3.2rem);
          line-height: 1.08;
          letter-spacing: -0.035em;
          color: var(--fg-0);
        }

        .muted {
          color: var(--fg-2);
        }

        /* ── Cards ────────────────────────────────────────────────────── */
        .grid {
          display: grid;
          gap: 16px;
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
          align-items: stretch;
          gap: 10px;
          padding: 28px;
          border-radius: var(--r-xl);
        }

        .tile :global(.mini) {
          margin-bottom: 18px;
        }

        .tile h3,
        .trust-list h3 {
          margin: 0;
          font-size: 1.1rem;
          letter-spacing: -0.01em;
          color: var(--fg-0);
        }

        .tile p,
        .trust-list p {
          margin: 0;
          color: var(--fg-1);
          line-height: 1.55;
          font-size: 0.95rem;
        }

        .square {
          align-self: flex-start;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          margin-bottom: 10px;
          border-radius: 13px;
          background: var(--glass-raised);
          border: 1px solid var(--line);
          box-shadow: var(--shadow-sm);
          color: var(--accent);
        }

        .square--positive {
          margin: 0;
          flex-shrink: 0;
          background: color-mix(in srgb, var(--positive) 12%, transparent);
          border-color: color-mix(in srgb, var(--positive) 25%, transparent);
          box-shadow: none;
          color: var(--positive);
        }

        /* ── How it works: a dark band ────────────────────────────────── */
        .band {
          display: flex;
          flex-direction: column;
          gap: 56px;
          padding: 72px 56px;
          border-radius: 32px;
          background:
            radial-gradient(
              120% 90% at 100% 0%,
              color-mix(in srgb, var(--accent) 28%, transparent),
              transparent 60%
            ),
            var(--ink);
          border: 1px solid var(--ink-line);
          color: var(--ink-fg);
        }

        .band h2 {
          color: var(--ink-fg);
        }

        .band .eyebrow {
          color: color-mix(in srgb, var(--accent) 65%, white);
        }

        .steps {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 40px;
        }

        .steps li {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding-top: 24px;
          border-top: 1px solid var(--ink-line);
        }

        .step-mark {
          display: flex;
          align-items: center;
          gap: 14px;
          margin: 0 0 12px;
        }

        .step-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 13px;
          background: var(--accent);
          color: var(--on-accent);
          box-shadow: 0 10px 24px -10px var(--accent);
        }

        .step-number {
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 2.6rem;
          font-weight: 700;
          line-height: 1;
          letter-spacing: -0.04em;
          color: color-mix(in srgb, var(--accent) 65%, white);
        }

        .steps h3 {
          margin: 0;
          font-size: 1.2rem;
          color: var(--ink-fg);
        }

        .steps p {
          margin: 0;
          color: var(--ink-muted);
          line-height: 1.55;
        }

        .features {
          display: flex;
          flex-direction: column;
          gap: 120px;
        }

        /* ── Privacy panel ────────────────────────────────────────────── */
        .trust {
          display: grid;
          grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
          gap: 48px;
          padding: 56px;
          border-radius: 32px;
        }

        .trust-head {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 14px;
        }

        .landing :global(.text-link) {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 8px;
          color: var(--accent);
          font-weight: 600;
        }

        .trust-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .trust-list li {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .trust-list li div {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        /* ── Built in the open ────────────────────────────────────────── */
        .source {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 32px;
          padding: 48px 56px;
          border-radius: 32px;
          background: var(--ink);
          border: 1px solid var(--ink-line);
          color: var(--ink-fg);
        }

        .prompt {
          margin: 0 0 16px;
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 0.9rem;
          color: var(--ink-muted);
        }

        .prompt span {
          color: var(--positive);
        }

        .source h2 {
          margin: 0 0 10px;
          font-size: clamp(1.6rem, 1.2rem + 1.4vw, 2.2rem);
          letter-spacing: -0.03em;
          color: var(--ink-fg);
        }

        .source p:not(.prompt) {
          margin: 0;
          max-width: 52ch;
          color: var(--ink-muted);
          line-height: 1.55;
        }

        .faq {
          max-width: 760px;
          width: 100%;
          align-self: center;
          gap: 32px;
        }

        .faq .head {
          align-self: center;
          text-align: center;
        }

        /* ── Final call: a panel in the accent colour ─────────────────── */
        .final {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 88px 32px;
          border-radius: 32px;
          text-align: center;
          background:
            radial-gradient(80% 120% at 50% 0%, rgba(255, 255, 255, 0.18), transparent 60%),
            var(--accent);
          color: var(--on-accent);
          box-shadow: 0 40px 80px -40px var(--accent);
        }

        .final h2 {
          margin: 0;
          font-size: clamp(2rem, 1.3rem + 2.8vw, 3.6rem);
          line-height: 1.05;
          letter-spacing: -0.035em;
        }

        .final p {
          margin: 0 0 12px;
          max-width: 36ch;
          font-size: 1.15rem;
          opacity: 0.88;
        }

        @media (max-width: 999px) {
          .hero {
            grid-template-columns: minmax(0, 1fr);
            gap: 56px;
          }
        }

        @media (max-width: 899px) {
          .grid--3,
          .grid--4 {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .grid--3 > :global(:last-child:nth-child(odd)) {
            grid-column: 1 / -1;
          }

          .steps {
            grid-template-columns: minmax(0, 1fr);
            gap: 32px;
          }

          .trust {
            grid-template-columns: minmax(0, 1fr);
          }

          .source {
            flex-direction: column;
            align-items: flex-start;
          }

          .features {
            gap: 88px;
          }
        }

        @media (max-width: 599px) {
          .landing {
            padding: 8px 16px 24px;
          }

          main {
            gap: 88px;
            padding-top: 32px;
          }

          .section {
            gap: 32px;
          }

          .ctas {
            flex-direction: column;
            align-self: stretch;
          }

          .grid--3,
          .grid--4 {
            grid-template-columns: minmax(0, 1fr);
          }

          .tile {
            padding: 24px;
          }

          .band,
          .trust,
          .source {
            padding: 40px 24px;
            border-radius: 24px;
          }

          .band {
            gap: 40px;
          }

          .final {
            padding: 56px 24px;
            border-radius: 24px;
          }

          .features {
            gap: 72px;
          }
        }
      `}</style>
    </>
  );
}
