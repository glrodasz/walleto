import { useState } from "react";
import { useRouter } from "next/router";
import auth0 from "../../lib/auth0";
import { OnboardingLayout } from "../../features/onboarding/components/OnboardingLayout";
import { CategoriesStep } from "../../features/onboarding/components/CategoriesStep";
import { WizardActions } from "../../features/onboarding/components/WizardActions";
import { useUserDoc } from "../../hooks/useUserDoc";

export const getServerSideProps = auth0.withPageAuthRequired();

export default function OnboardingCategories() {
  const router = useRouter();
  const { update } = useUserDoc();
  const [busy, setBusy] = useState(false);

  const skip = async () => {
    setBusy(true);
    try {
      await update({ onboardingCompleted: true });
      router.push("/");
    } catch (err) {
      console.error("Failed to skip onboarding:", err);
      setBusy(false);
    }
  };

  // Categories persist as they're created, so there is nothing to flush.
  const go = (href: string) => router.push(href);

  return (
    <OnboardingLayout
      step={1}
      description="Let's start with your categories. Add your main categories."
      onNavigate={go}
      busy={busy}
      footer={
        <div className="footer">
          <button type="button" className="skip" onClick={skip} disabled={busy}>
            Skip for now
          </button>
          <WizardActions onNext={() => go("/onboarding/methods")} busy={busy} />

          <style jsx>{`
            .footer {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 16px;
              width: 100%;
            }

            .skip {
              border: none;
              background: none;
              padding: 0;
              font-family: inherit;
              font-size: 0.875rem;
              color: var(--fg-2);
              cursor: pointer;
              text-decoration: underline;
              white-space: nowrap;
              flex-shrink: 0;
            }

            .skip:hover:not(:disabled) {
              color: var(--fg-1);
            }

            .skip:disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }
          `}</style>
        </div>
      }
    >
      <CategoriesStep />
    </OnboardingLayout>
  );
}
