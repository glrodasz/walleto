import { useState } from "react";
import { useRouter } from "next/router";
import { Play, Rocket } from "../../../components/atoms/Icons";
import { IconDisc } from "../../../components/molecules/IconDisc";
import { t } from "../../../helpers/i18n";
import { useUserDoc } from "../../../hooks/useUserDoc";
import { SettingsCard } from "./SettingsCard";

/** Tools that reshape the account: today, re-running the assisted setup. */
export function SetupCard() {
  const router = useRouter();
  const { update } = useUserDoc();
  const [busy, setBusy] = useState(false);

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
    <SettingsCard
      title={t("settings.setup.title")}
      subtitle={t("settings.setup.subtitle")}
      icon={Rocket}
    >
      <button
        type="button"
        className="tool"
        aria-label="Redo onboarding"
        onClick={redoOnboarding}
        disabled={busy}
      >
        <IconDisc size={40}>
          <Play size={16} />
        </IconDisc>
        <span className="text">
          <span className="title">{busy ? "Starting…" : "Redo onboarding"}</span>
          <span className="desc">
            Go through the guided setup again to review your categories, payment methods, and
            recurring items.
          </span>
        </span>
        <span className="chevron" aria-hidden="true">
          ›
        </span>
      </button>
      <style jsx>{`
        .tool {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 12px;
          border: 1px solid var(--glass-rim);
          border-radius: var(--r-lg);
          background: var(--glass-inset);
          font-family: inherit;
          text-align: left;
          color: inherit;
          cursor: pointer;
        }

        .tool:hover:not(:disabled) {
          border-color: var(--line-strong);
        }

        .tool:disabled {
          opacity: 0.6;
          cursor: wait;
        }

        .text {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .title {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--fg-0);
        }

        .desc {
          font-size: 0.78rem;
          color: var(--fg-2);
        }

        .chevron {
          font-size: 1.4rem;
          color: var(--fg-2);
          line-height: 1;
        }
      `}</style>
    </SettingsCard>
  );
}
