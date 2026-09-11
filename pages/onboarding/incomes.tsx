import { useEffect, useState } from "react";
import auth0 from "../../lib/auth0";
import { OnboardingLayout } from "../../features/onboarding/components/OnboardingLayout";
import { RecurrentStep } from "../../features/onboarding/components/RecurrentStep";
import { useRecurrentStep } from "../../features/onboarding/hooks/useRecurrentStep";
import { useStepNavigation } from "../../features/onboarding/hooks/useStepNavigation";
import { CurrencyPicker } from "../../features/onboarding/components/CurrencyPicker";
import { WizardActions } from "../../features/onboarding/components/WizardActions";
import { useUserDoc } from "../../hooks/useUserDoc";
import type { Currency } from "../../types";

export const getServerSideProps = auth0.withPageAuthRequired();

export default function OnboardingIncomes() {
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

  const { busy, error, go } = useStepNavigation(async () => {
    if (currency !== userDoc?.mainCurrency) {
      await update({ mainCurrency: currency });
    }
    await state.save();
  }, "Could not save your incomes. Please try again.");

  return (
    <OnboardingLayout
      step={3}
      onBack={() => go("/onboarding/methods")}
      onNavigate={go}
      busy={busy}
      footer={
        <WizardActions
          onBack={() => go("/onboarding/methods")}
          onNext={() => go("/onboarding/expenses")}
          busy={busy}
          error={error}
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
        <h2 className="heading">Set up your incomes</h2>
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
