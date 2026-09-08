import { useMemo, useState } from "react";
import { Modal } from "../../../components/molecules/Modal";
import { Select } from "../../../components/atoms/Select";
import { Button } from "../../../components/atoms/Button";
import { formatAmount } from "../../../components/atoms/Amount";
import { useCategories } from "../../../hooks/useCategories";
import { useDomainTransactions } from "../../../hooks/useDomainTransactions";
import { useMoneyContext } from "../../../hooks/useMoneyContext";
import { costBasisAt } from "../helpers/valuation";
import { ValuationModal } from "./ValuationModal";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Skip the picker when the caller already knows the category. */
  categoryId?: string;
}

/** Cost basis needs the category's whole history, not a page's window. */
const INCEPTION = new Date(2000, 0, 1);

/**
 * "Record current value" from anywhere: pick the investment, see what has
 * gone into it, then the usual gain-% / value form. Mounted only while
 * open, so the inception-to-date listener it needs runs nowhere else.
 */
export function RecordValueModal({ open, onClose, categoryId: preset }: Props) {
  const { ctx, target } = useMoneyContext();
  const { categories } = useCategories("INVESTMENT");
  const { transactions } = useDomainTransactions("INVESTMENT", INCEPTION);
  const [picked, setPicked] = useState(preset ?? "");
  const [step, setStep] = useState<"pick" | "value">(preset ? "value" : "pick");

  const roots = categories.filter((c) => !c.parentId);
  const category = categories.find((c) => c.id === picked) ?? null;
  const now = useMemo(() => new Date(), []);
  const invested = useMemo(
    () => (picked ? costBasisAt(transactions, picked, now, ctx) : 0),
    [transactions, picked, now, ctx]
  );

  if (step === "value" && category?.id) {
    return (
      <ValuationModal
        open={open}
        categoryId={category.id}
        categoryName={category.name}
        costBasis={invested}
        currency={target}
        onClose={onClose}
      />
    );
  }

  return (
    <Modal open={open} title="Record current value" onClose={onClose}>
      <div className="form">
        <Select
          label="Investment"
          placeholder="Pick an investment"
          options={roots.map((c) => ({ value: c.id!, label: c.name }))}
          value={picked}
          onValueChange={setPicked}
        />
        {picked && (
          <p className="basis">
            Invested so far: <strong>{formatAmount(invested, target)}</strong>
          </p>
        )}
        <div className="actions">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => setStep("value")} disabled={!picked}>
            Continue
          </Button>
        </div>
      </div>

      <style jsx>{`
        .form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .basis {
          margin: 0;
          font-size: 0.85rem;
          color: var(--fg-2);
        }

        .basis strong {
          color: var(--fg-0);
          font-family: var(--font-mono, "JetBrains Mono", ui-monospace, monospace);
          font-variant-numeric: tabular-nums;
        }

        .actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }
      `}</style>
    </Modal>
  );
}
