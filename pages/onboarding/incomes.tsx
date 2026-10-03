import { useEffect, useState } from "react";
import { withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import { OnboardingLayout } from "../../features/onboarding/components/OnboardingLayout";
import { RecurrentStep } from "../../features/onboarding/components/RecurrentStep";
import { useRecurrentStep } from "../../features/onboarding/hooks/useRecurrentStep";
import { useStepNavigation } from "../../features/onboarding/hooks/useStepNavigation";
import { CurrencyPicker } from "../../features/onboarding/components/CurrencyPicker";
import { WizardActions } from "../../features/onboarding/components/WizardActions";
import { ContinueLater } from "../../features/onboarding/components/ContinueLater";
import { useLeaveOnboarding } from "../../features/onboarding/hooks/useLeaveOnboarding";
import { useUserDoc } from "../../hooks/useUserDoc";
import type { Currency } from "../../types";

// Auth is checked on the client, not in getServerSideProps: with a server
// guard every Next/Back became a serverless round trip (often a cold start)
// before the next step could render. Static pages switch instantly, and the
// data is still guarded by Firestore rules and the API routes.
function OnboardingIncomes() {
  const { userDoc, update } = useUserDoc();
  const [currency, setCurrency] = useState<Currency>("USD");
  const [currencyTouched, setCurrencyTouched] = useState(false);
  // The picker sets the reporting currency and the default for new rows; each
  // row can still be switched to its own currency.
  const state = useRecurrentStep("INCOME", currency);

  // Adopt the stored currency until the user picks one themselves.
  useEffect(() => {
    if (!currencyTouched && userDoc?.mainCurrency) {
      setCurrency(userDoc.mainCurrency);
    }
  }, [userDoc?.mainCurrency, currencyTouched]);

  const { busy, error, flush, go } = useStepNavigation(async () => {
    if (currency !== userDoc?.mainCurrency) {
      await update({ mainCurrency: currency });
    }
    await state.save();
  }, "Could not save your income. Please try again.");
  const later = useLeaveOnboarding(flush);

  return (
    <OnboardingLayout
      step={3}
      onNavigate={go}
      busy={busy || later.leaving}
      footer={
        <WizardActions
          leading={<ContinueLater step={3} onClick={later.leave} busy={busy || later.leaving} />}
          onBack={() => go("/onboarding/methods")}
          onNext={() => go("/onboarding/expenses")}
          busy={busy || later.leaving}
          error={error ?? later.error}
        />
      }
    >
      <CurrencyPicker
        value={currency}
        onChange={(next) => {
          setCurrencyTouched(true);
          setCurrency(next);
        }}
      />

      <section className="incomes">
        <h2 className="heading">What do you earn each month?</h2>
        <RecurrentStep state={state} />
      </section>

      <style jsx>{`
        .incomes {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .heading {
          margin: 0;
          font-size: 0.9375rem;
          font-weight: 600;
          color: var(--fg-1);
        }
      `}</style>
    </OnboardingLayout>
  );
}

export default withPageAuthRequired(OnboardingIncomes);
