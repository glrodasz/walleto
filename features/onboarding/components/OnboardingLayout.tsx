import { useEffect } from "react";
import type { ComponentType, CSSProperties, ReactNode } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { ArrowDown, ArrowUp, Check, Coins, CreditCard, Tag } from "../../../components/atoms/Icons";
import type { IconProps } from "../../../components/atoms/Icons";

interface OnboardingStep {
  label: string;
  href: string;
  /** Stands in for a step number: the steps are tabs, not a forced sequence. */
  Icon: ComponentType<IconProps>;
  /** The domain colour for the Income / Expenses steps; the app accent otherwise. */
  accent?: string;
}

export const ONBOARDING_STEPS: readonly OnboardingStep[] = [
  { label: "Categories", href: "/onboarding/categories", Icon: Tag },
  { label: "Currencies", href: "/onboarding/currencies", Icon: Coins },
  { label: "Payment methods", href: "/onboarding/methods", Icon: CreditCard },
  {
    label: "Income",
    href: "/onboarding/incomes",
    Icon: ArrowUp,
    accent: "var(--domain-income)",
  },
  {
    label: "Expenses",
    href: "/onboarding/expenses",
    Icon: ArrowDown,
    accent: "var(--domain-expense)",
  },
  { label: "Review", href: "/onboarding/review", Icon: Check },
];

/** The colour a step is tinted with (stepper tab, progress fill, its panels). */
export const stepAccent = (step: OnboardingStep | undefined) => step?.accent ?? "var(--accent)";

interface Props {
  /**
   * 1-based index into ONBOARDING_STEPS. 0 is the Welcome: the stepper as a
   * preview, every step still ahead. Without it (the tour) there is no stepper.
   */
  step?: number;
  /** The heading, and the tab title before " — Walleto". */
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Stepper click. When absent the stepper is display-only. */
  onNavigate?: (href: string) => void;
  /** Disables the stepper while the current step is saving. */
  busy?: boolean;
  /**
   * On phones, stretch the body down to the footer bar so a single child
   * (with `flex: 1`) can take the whole screen. The Welcome and the tour use it.
   */
  fill?: boolean;
}

export function OnboardingLayout({
  step,
  title = "Build your plan",
  description,
  children,
  footer,
  onNavigate,
  busy = false,
  fill = false,
}: Props) {
  const router = useRouter();

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

      <div className={`layout${fill ? " layout--fill" : ""}`}>
        <div className="shell">
          {/* No back arrow up here: Back, Next and the way out all live in the
              footer, so a second Back would only be a duplicate. */}
          <header className="header">
            <h1 className="title">{title}</h1>
          </header>

          {step !== undefined && (
            <nav
              className={`stepper${step === 0 ? " stepper--preview" : ""}`}
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

          {description && <p className="description">{description}</p>}

          <div className="body">{children}</div>

          {footer && (
            <div className="footer" data-overlay-bottom-bar>
              {footer}
            </div>
          )}
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

        .description {
          margin: 28px 0 0;
          font-size: 0.9375rem;
          color: var(--fg-1);
        }

        .body {
          margin-top: 28px;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .footer {
          margin-top: 48px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
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

          /* The Welcome's preview has no current tab to stretch, so the six
             icons spread over the track instead of bunching up on the left. */
          .stepper--preview .tabs {
            justify-content: space-between;
          }

          /* The layout is a single-line flex row, so its min-height already
             stretches the shell; the body then takes what the header leaves. */
          .layout--fill {
            min-height: 100dvh;
          }

          .layout--fill .body {
            flex: 1;
            margin-top: 20px;
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
