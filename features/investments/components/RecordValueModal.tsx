import { useMemo, useState } from "react";
import { Modal } from "../../../components/molecules/Modal";
import { Select } from "../../../components/atoms/Select";
import { Button } from "../../../components/atoms/Button";
import { useMoneyFormat } from "../../../hooks/useMoneyFormat";
import { useAccounts } from "../../../hooks/useAccounts";
import { useCategories } from "../../../hooks/useCategories";
import { useDomainTransactions } from "../../../hooks/useDomainTransactions";
import { useMoneyContext } from "../../../hooks/useMoneyContext";
import { ACCOUNT_NOUN, accountLabel } from "../../../helpers/accounts";
import { useAllInvestmentValuations } from "../../../hooks/useInvestmentValuations";
import {
  INCEPTION,
  costBasisAt,
  currentValue,
  dominantCategoryId,
  matchesSelector,
  positionSign,
  selectorKey,
  withDomain,
} from "../helpers/valuation";
import type { ValueSelector } from "../helpers/valuation";
import { ValuationModal } from "./ValuationModal";
import type { AccountDomain } from "../../../types";

interface Props {
  open: boolean;
  onClose: () => void;
  domain: AccountDomain;
}

/**
 * "Update current value" from anywhere: pick the account / pocket — or the
 * "No account" bucket, when something sits in it — see what has gone into
 * it, then the usual gain-% / value form. Mounted only while open, so the
 * inception-to-date listener it needs runs nowhere else.
 */
export function RecordValueModal({ open, onClose, domain }: Props) {
  const { ctx, target } = useMoneyContext();
  const { formatAmount } = useMoneyFormat();
  const { accounts } = useAccounts(domain);
  const { categories } = useCategories(domain);
  const { transactions } = useDomainTransactions(domain, INCEPTION);
  const { valuations: rawValuations } = useAllInvestmentValuations();
  const [picked, setPicked] = useState("");
  const [step, setStep] = useState<"pick" | "value">("pick");
  const noun = ACCOUNT_NOUN[domain].singular;
  const owes = domain === "DEBT";
  const entry = owes ? "repayment" : domain === "SAVING" ? "deposit" : "contribution";
  const now = useMemo(() => new Date(), []);

  const choices = useMemo(() => {
    const byAccount = accounts
      .filter((a) => a.id)
      .map((a) => ({ selector: { accountId: a.id! } as ValueSelector, label: accountLabel(a) }));
    const bucket: ValueSelector = { domain };
    const valuations = withDomain(rawValuations, categories);
    const hasBucket =
      costBasisAt(transactions, bucket, now, ctx) !== 0 ||
      valuations.some((v) => matchesSelector(v, bucket));
    const unassigned = hasBucket ? [{ selector: bucket, label: `No ${noun}` }] : [];
    return [...byAccount, ...unassigned].map((c) => ({ ...c, key: selectorKey(c.selector) }));
  }, [accounts, categories, domain, rawValuations, transactions, now, ctx, noun]);

  const choice = choices.find((c) => c.key === picked) ?? null;
  const invested = useMemo(
    () => (choice ? costBasisAt(transactions, choice.selector, now, ctx) : 0),
    [transactions, choice, now, ctx]
  );
  // A debt's balance form opens on what it is estimated to owe today.
  const owedNow = useMemo(() => {
    if (!owes || !choice) return undefined;
    const selector = choice.selector;
    const rate =
      "accountId" in selector
        ? accounts.find((a) => a.id === selector.accountId)?.interestRate
        : undefined;
    const valuations = withDomain(rawValuations, categories);
    return currentValue(transactions, valuations, selector, rate, now, ctx, positionSign(domain));
  }, [owes, choice, accounts, rawValuations, categories, transactions, now, ctx, domain]);

  if (step === "value" && choice) {
    return (
      <ValuationModal
        open={open}
        domain={domain}
        selector={choice.selector}
        name={choice.label}
        costBasis={invested}
        latestValue={owedNow}
        currency={target}
        categories={categories}
        suggestedCategoryId={dominantCategoryId(transactions, choice.selector, categories, ctx)}
        onClose={onClose}
      />
    );
  }

  const label = noun.charAt(0).toUpperCase() + noun.slice(1);

  return (
    <Modal open={open} title={`Update current ${owes ? "balance" : "value"}`} onClose={onClose}>
      <div className="form">
        {choices.length === 0 ? (
          <p className="basis">
            No {noun} to {owes ? "record a balance for" : "value"} yet — file a {entry} under one
            first.
          </p>
        ) : (
          <Select
            label={label}
            placeholder={`Pick ${owes ? "a debt" : domain === "SAVING" ? "a pocket" : "an account"}`}
            options={choices.map((c) => ({ value: c.key, label: c.label }))}
            value={picked}
            onValueChange={setPicked}
          />
        )}
        {choice && (
          <p className="basis">
            {owes ? "Repaid" : "In"} so far: <strong>{formatAmount(invested, target)}</strong>
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
