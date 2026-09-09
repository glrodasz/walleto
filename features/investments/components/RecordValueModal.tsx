import { useMemo, useState } from "react";
import { Modal } from "../../../components/molecules/Modal";
import { Select } from "../../../components/atoms/Select";
import { Button } from "../../../components/atoms/Button";
import { formatAmount } from "../../../components/atoms/Amount";
import { useAccounts } from "../../../hooks/useAccounts";
import { useCategories } from "../../../hooks/useCategories";
import { useDomainTransactions } from "../../../hooks/useDomainTransactions";
import { useMoneyContext } from "../../../hooks/useMoneyContext";
import { ACCOUNT_NOUN, accountLabel } from "../../../helpers/accounts";
import { costBasisAt, selectorKey } from "../helpers/valuation";
import type { ValueSelector } from "../helpers/valuation";
import { ValuationModal } from "./ValuationModal";
import type { AccountDomain } from "../../../types";

interface Props {
  open: boolean;
  onClose: () => void;
  domain: AccountDomain;
}

/** Cost basis needs the whole history, not a page's window. */
const INCEPTION = new Date(2000, 0, 1);

/**
 * "Record current value" from anywhere: pick the account / pocket — or a
 * category still holding entries filed under none — see what has gone into
 * it, then the usual gain-% / value form. Mounted only while open, so the
 * inception-to-date listener it needs runs nowhere else.
 */
export function RecordValueModal({ open, onClose, domain }: Props) {
  const { ctx, target } = useMoneyContext();
  const { accounts } = useAccounts(domain);
  const { categories } = useCategories(domain);
  const { transactions } = useDomainTransactions(domain, INCEPTION);
  const [picked, setPicked] = useState("");
  const [step, setStep] = useState<"pick" | "value">("pick");
  const noun = ACCOUNT_NOUN[domain].singular;
  const now = useMemo(() => new Date(), []);

  const choices = useMemo(() => {
    const byAccount = accounts
      .filter((a) => a.id)
      .map((a) => ({ selector: { accountId: a.id! } as ValueSelector, label: accountLabel(a) }));
    const unassigned = categories
      .filter((c) => !c.parentId && c.id)
      .map((c) => ({
        selector: { categoryId: c.id! } as ValueSelector,
        label: `${c.name} · no ${noun}`,
      }))
      .filter((c) => costBasisAt(transactions, c.selector, now, ctx) > 0);
    return [...byAccount, ...unassigned].map((c) => ({ ...c, key: selectorKey(c.selector) }));
  }, [accounts, categories, transactions, now, ctx, noun]);

  const choice = choices.find((c) => c.key === picked) ?? null;
  const invested = useMemo(
    () => (choice ? costBasisAt(transactions, choice.selector, now, ctx) : 0),
    [transactions, choice, now, ctx]
  );

  if (step === "value" && choice) {
    return (
      <ValuationModal
        open={open}
        selector={choice.selector}
        name={choice.label}
        costBasis={invested}
        currency={target}
        onClose={onClose}
      />
    );
  }

  const label = noun.charAt(0).toUpperCase() + noun.slice(1);

  return (
    <Modal open={open} title="Record current value" onClose={onClose}>
      <div className="form">
        {choices.length === 0 ? (
          <p className="basis">
            No {noun} to value yet — file a {domain === "SAVING" ? "deposit" : "contribution"} under
            one first.
          </p>
        ) : (
          <Select
            label={label}
            placeholder={`Pick ${domain === "SAVING" ? "a pocket" : "an account"}`}
            options={choices.map((c) => ({ value: c.key, label: c.label }))}
            value={picked}
            onValueChange={setPicked}
          />
        )}
        {choice && (
          <p className="basis">
            In so far: <strong>{formatAmount(invested, target)}</strong>
          </p>
        )}
        <div className="actions">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => setStep("value")} disabled={!choice}>
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
