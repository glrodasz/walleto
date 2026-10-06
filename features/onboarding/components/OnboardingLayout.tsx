import { useEffect } from "react";
import type { CSSProperties, ReactNode } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { ONBOARDING_STEPS, stepAccent } from "../data/steps";
import type { IntroSlideId } from "../data/introSlides";
import { IntroPanel } from "./IntroPanel";

interface Props {
  /**
   * 1-based index into ONBOARDING_STEPS: draws the stepper, and the step's
   * intro slide beside it. Without it (the Welcome) there is no stepper.
   */
  step?: number;
  /** The intro slide for a screen that isn't a step (the Welcome). */
  intro?: IntroSlideId;
  /** The heading, and the tab title before " — Walleto". */
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Stepper click. When absent the stepper is display-only. */
  onNavigate?: (href: string) => void;
  /** Disables the stepper while the current step is saving. */
  busy?: boolean;
}

export function OnboardingLayout({
  step,
  intro: introProp,
  title = "Build your plan",
  description,
  children,
  footer,
  onNavigate,
  busy = false,
}: Props) {
  const router = useRouter();
  const intro = introProp ?? (step ? ONBOARDING_STEPS[step - 1]?.intro : undefined);

  // Steps navigate with router.push, which (unlike <Link>) doesn't prefetch:
  // load the other steps' code up front so Next/Back don't wait on a chunk.
  useEffect(() => {
    for (const s of ONBOARDING_STEPS) {
      // Best effort; Storybook's router mock returns undefined, hence the wrap.
      Promise.resolve(router.prefetch?.(s.href)).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per mount
  }, []);

  return (
    <>
      <Head>
        <title>{`${title} — Walleto`}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="layout">
        <div className={`shell${intro ? " shell--split" : ""}`}>
          {/* No back arrow up here: Back, Next and the way out all live in the
              footer, so a second Back would only be a duplicate. */}
          <header className="header">
            <h1 className="title">{title}</h1>
          </header>

          {step !== undefined && (
            <nav
              className="stepper"
              aria-label="Setup progress"
              style={
                { "--current-accent": stepAccent(ONBOARDING_STEPS[step - 1]) } as CSSProperties
              }
            >
              <ol className="tabs">
                {ONBOARDING_STEPS.map((s, i) => {
                  const n = i + 1;
                  const state = n === step ? "current" : n < step ? "done" : "todo";
                  const isCurrent = n === step;
                  return (
                    <li
                      key={s.href}
                      className={`tab tab--${state}`}
                      style={{ "--step-accent": stepAccent(s) } as CSSProperties}
                    >
                      <button
                        type="button"
                        className="tab-btn"
                        aria-label={s.label}
                        aria-current={isCurrent ? "step" : undefined}
                        disabled={isCurrent || busy || !onNavigate}
                        onClick={() => onNavigate?.(s.href)}
                      >
                        <span className="tab-icon">
                          <s.Icon size={14} />
                        </span>
                        <span className="tab-label">{s.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
              <div className="track">
                <div
                  className="fill"
                  style={{ width: `${(step / ONBOARDING_STEPS.length) * 100}%` }}
                />
              </div>
            </nav>
          )}

          {/* Intro beside the step on desktop, its text above the step below
              that. The footer stays the last child of .main: on phones it is
              position: fixed, so nothing up this tree may become its
              containing block (transform, filter, backdrop-filter…). */}
          <div className="columns">
            {intro && (
              <aside className="aside">
                {/* A screen without a step has no form under its intro, so the
                    scene can stay when it stacks. */}
                <IntroPanel id={intro} sceneWhenStacked={step === undefined} />
              </aside>
            )}
            <div className="main">
              {description && <p className="description">{description}</p>}

              <div className="body">{children}</div>

              {footer && (
                <div className="footer" data-overlay-bottom-bar>
                  {footer}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* No background of its own: the wizard sits on the same backdrop as
           the app, so the glass it is made of has something to refract. */
        .layout {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          padding: 48px 24px 64px;
        }

        .shell {
          width: 100%;
          max-width: 860px;
          display: flex;
          flex-direction: column;
        }

        .header {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 40px;
        }

        .title {
          margin: 0;
          font-size: 1.375rem;
          font-weight: 700;
          color: var(--fg-0);
        }

        .stepper {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 28px;
        }

        .tabs {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          /* One equal column per step, however many there are. */
          grid-auto-flow: column;
          grid-auto-columns: minmax(0, 1fr);
          gap: 6px;
        }

        .tab {
          min-width: 0;
        }

        .tab-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 8px;
          border: none;
          border-radius: var(--r-sm);
          background: transparent;
          font: inherit;
          font-size: 0.875rem;
          font-weight: 600;
          text-align: left;
          color: var(--fg-2);
          cursor: pointer;
          transition:
            background 0.15s,
            color 0.15s;
        }

        .tab-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          flex-shrink: 0;
          border-radius: 999px;
          border: 1px solid var(--glass-rim);
          color: var(--fg-2);
          transition:
            background 0.15s,
            color 0.15s,
            border-color 0.15s;
        }

        .tab-label {
          min-width: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .tab--done .tab-icon {
          color: var(--step-accent);
          border-color: var(--step-accent);
        }

        .tab--current .tab-icon {
          color: var(--step-accent);
          border-color: var(--step-accent);
          background: color-mix(in srgb, var(--step-accent) 18%, transparent);
        }

        .tab-btn:hover:not(:disabled) {
          background: var(--glass-hover);
          color: var(--fg-0);
        }

        /* The current step is disabled only so it can't be re-navigated to;
           it must not look faded like a truly unavailable control would. */
        .tab--current .tab-btn {
          color: var(--step-accent);
          cursor: default;
        }

        .tab--done .tab-btn {
          color: var(--fg-1);
        }

        .tab-btn:disabled:not(.tab--current .tab-btn) {
          cursor: default;
        }

        .track {
          height: 3px;
          border-radius: 999px;
          background: var(--line);
          overflow: hidden;
        }

        .fill {
          height: 100%;
          border-radius: 999px;
          background: var(--current-accent);
          transition:
            width 240ms ease,
            background 240ms ease;
        }

        .columns {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .main {
          display: flex;
          flex-direction: column;
          gap: 28px;
          min-width: 0;
        }

        .description {
          margin: 0;
          font-size: 0.9375rem;
          color: var(--fg-1);
        }

        .body {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .footer {
          margin-top: 20px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
        }

        /* Desktop: the intro beside the step. Not below 1200px: the payment
           method editor needs about 700px of its own (IntroPanel stacks at the
           same width, so keep the two in step). */
        @media (min-width: 1200px) {
          .shell--split {
            max-width: 1240px;
          }

          .shell--split .columns {
            display: grid;
            grid-template-columns: 360px minmax(0, 1fr);
            align-items: start;
            gap: 48px;
          }

          .aside {
            position: sticky;
            top: 32px;
          }
        }

        /* Too short for the sticky panel to fit: let it scroll away. */
        @media (min-width: 1200px) and (max-height: 640px) {
          .aside {
            position: static;
          }
        }

        @media (max-width: 767px) {
          .layout {
            /* Extra bottom padding reserves room for the fixed footer bar below,
               so the last bit of content never sits underneath it. */
            padding: 24px 16px calc(96px + env(safe-area-inset-bottom, 0px));
          }

          .header {
            margin-bottom: 28px;
          }

          .title {
            font-size: 1.125rem;
          }

          /* Six labels don't fit a phone: every step is its icon, and only the
             current one keeps its name next to it. */
          .tabs {
            display: flex;
            gap: 4px;
          }

          .tab {
            flex: 0 0 auto;
          }

          .tab--current {
            flex: 1 1 auto;
          }

          .tab-btn {
            font-size: 0.8125rem;
            padding: 4px;
          }

          .tab:not(.tab--current) .tab-label {
            display: none;
          }

          .columns {
            gap: 20px;
          }

          .footer {
            position: fixed;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: var(--z-nav, 100);
            margin-top: 0;
            padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px));
            background-color: var(--glass-strong);
            background-image: var(--glass-sheen);
            backdrop-filter: blur(var(--glass-blur-lg)) saturate(var(--glass-saturate));
            -webkit-backdrop-filter: blur(var(--glass-blur-lg)) saturate(var(--glass-saturate));
            border-top: 1px solid var(--glass-rim);
            box-shadow: inset 0 1px 0 var(--glass-edge);
          }
        }
      `}</style>
    </>
  );
}
