import { useState } from "react";
import { Card } from "../../../components/atoms/Card";
import { SectionTitle } from "../../../components/atoms/SectionTitle";
import { Button } from "../../../components/atoms/Button";
import { MethodsStep } from "../../onboarding/components/MethodsStep";
import { useMethodsStep } from "../../onboarding/hooks/useMethodsStep";
import { MethodsList } from "../../methods/components/MethodsList";
import { EditMethodModal } from "../../methods/components/EditMethodModal";
import { usePaymentMethods } from "../../../hooks/usePaymentMethods";
import { errorMessage } from "../../../utils/errorMessage";
import type { PaymentMethod } from "../../../types";
import { useT } from "../../../hooks/useT";
import { COMMON_MESSAGES } from "../../../messages/common";
import { SETTINGS_MESSAGES } from "../messages";

/**
 * Payment methods, now a Settings section: the wizard's add-a-method rows on
 * top (a blank form, nothing hydrated) and the saved list under it, with
 * edit and archive per row.
 */
export function MethodsSettings() {
  const draftState = useMethodsStep({ hydrate: false });
  const { methods, loading, remove } = usePaymentMethods();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState<number | null>(null);
  const [editing, setEditing] = useState<PaymentMethod | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const tr = useT(SETTINGS_MESSAGES);
  const tc = useT(COMMON_MESSAGES);

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
      setError(errorMessage(err, tr("methods.saveFailed")));
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
    <>
      <Card>
        <SectionTitle title={tr("methods.add")} subtitle={tr("methods.addHint")} />
        <MethodsStep state={draftState} />
        <div className="actions">
          <Button variant="primary" onClick={save} disabled={busy}>
            {busy ? tc("action.saving") : tc("action.save")}
          </Button>
          {error && <span className="error">{error}</span>}
          {!error && savedCount !== null && (
            <span className="success">
              {savedCount > 0 ? tr("methods.saved", { count: savedCount }) : tr("methods.upToDate")}
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
        .actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .error {
          font-size: 0.85rem;
          color: var(--accent-hot);
        }

        .success {
          font-size: 0.85rem;
          color: var(--domain-income);
        }
      `}</style>
    </>
  );
}
