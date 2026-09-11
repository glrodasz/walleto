import { useState } from "react";
import { withOnboardingGuard } from "../features/onboarding/helpers/onboardingGuard";
import { PageLayout } from "../components/organisms/PageLayout";
import { Card } from "../components/atoms/Card";
import { SectionTitle } from "../components/atoms/SectionTitle";
import { Button } from "../components/atoms/Button";
import { MethodsStep } from "../features/onboarding/components/MethodsStep";
import { useMethodsStep } from "../features/onboarding/hooks/useMethodsStep";
import { MethodsList } from "../features/methods/components/MethodsList";
import { EditMethodModal } from "../features/methods/components/EditMethodModal";
import { usePaymentMethods } from "../hooks/usePaymentMethods";
import type { PaymentMethod } from "../types";

export const getServerSideProps = withOnboardingGuard();

export default function MethodsPage() {
  const draftState = useMethodsStep({ hydrate: false });
  const { methods, loading, remove } = usePaymentMethods();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState<number | null>(null);
  const [editing, setEditing] = useState<PaymentMethod | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);

  const save = async () => {
    setBusy(true);
    setError(null);
    setSavedCount(null);
    try {
      const created = await draftState.save();
      setSavedCount(created);
      // The list below now shows them; the form goes back to one blank row.
      if (created > 0) draftState.reset();
    } catch (err) {
      console.error("Failed to save payment methods:", err);
      setError("Couldn't save — try again");
    } finally {
      setBusy(false);
    }
  };

  const archive = async (id: string) => {
    setArchivingId(id);
    try {
      await remove(id);
    } catch (err) {
      console.error("Failed to archive payment method:", err);
    } finally {
      setArchivingId(null);
    }
  };

  return (
    <PageLayout title="Payment methods" hideCurrency hideMonth>
      <Card>
        <SectionTitle title="Add a method" />
        <p className="hint">Cards, bank accounts and wallets you use for incomes and expenses.</p>

        <MethodsStep state={draftState} />

        <div className="actions">
          <Button variant="primary" onClick={save} disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </Button>
          {error && <span className="error">{error}</span>}
          {!error && savedCount !== null && (
            <span className="success">
              {savedCount > 0
                ? `Saved ${savedCount} new method${savedCount === 1 ? "" : "s"}`
                : "Up to date"}
            </span>
          )}
        </div>
      </Card>

      <MethodsList
        methods={methods}
        loading={loading}
        archivingId={archivingId}
        onEdit={setEditing}
        onArchive={archive}
      />

      <EditMethodModal method={editing} onClose={() => setEditing(null)} />

      <style jsx>{`
        .hint {
          margin: 0 0 20px;
          font-size: 0.85rem;
          color: var(--fg-1);
        }

        .actions {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 20px;
        }

        .error {
          font-size: 0.85rem;
          color: var(--accent-hot);
        }

        .success {
          font-size: 0.85rem;
          color: var(--accent);
        }
      `}</style>
    </PageLayout>
  );
}
