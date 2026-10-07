import { useState } from "react";
import { Button } from "../atoms/Button";
import { AccountFormFields } from "./AccountFormFields";
import { ACCOUNT_NOUN } from "../../helpers/accounts";
import { emptyAccountDraft, readAccountDraft } from "../../helpers/accountDraft";
import { useDecimalInput } from "../../hooks/useDecimalInput";
import type { Account, AccountDomain, Currency } from "../../types";
import type { AccountInput } from "../../schemas";

interface Props {
  domain: AccountDomain;
  /** The domain's existing accounts: typing one of their names selects it instead. */
  accounts: Account[];
  defaultCurrency: Currency;
  createAccount: (input: AccountInput) => Promise<string>;
  /** The new (or matched) account's id. */
  onCreated: (accountId: string) => void;
  onCancel: () => void;
  onError?: (message: string) => void;
  /**
   * Dashed frame with a "New …" legend, to set it apart inside another form
   * (`AccountField`). Settings turns it off: there it sits in the list, like
   * the edit form.
   */
  framed?: boolean;
}

/**
 * The inline "new account / pocket / debt" form: the same fields as editing
 * one (`AccountFormFields`). Shared by the entry forms (`AccountField`) and
 * Settings. Mounted fresh each time, so its state needs no reset.
 */
export function AccountCreator({
  domain,
  accounts,
  defaultCurrency,
  createAccount,
  onCreated,
  onCancel,
  onError,
  framed = true,
}: Props) {
  const noun = ACCOUNT_NOUN[domain].singular;
  const { parse } = useDecimalInput();
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState(() => emptyAccountDraft(defaultCurrency));

  const commit = async () => {
    const existing = accounts.find((a) => a.name.toLowerCase() === draft.name.trim().toLowerCase());
    if (draft.name.trim() && existing?.id) {
      onCreated(existing.id);
      return;
    }
    const read = readAccountDraft(draft, parse, noun);
    if ("error" in read) return onError?.(read.error);
    const { name, provider, currency, interestRate } = read.values;
    setBusy(true);
    try {
      const id = await createAccount({
        domain,
        name,
        currency,
        ...(provider ? { provider } : {}),
        ...(interestRate ? { interestRate } : {}),
      });
      onCreated(id);
    } catch (err) {
      console.error("Failed to create account:", err);
      onError?.(`Couldn't create the ${noun} "${name}"`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <fieldset
      className={framed ? "creator creator--framed" : "creator"}
      aria-label={framed ? undefined : `New ${noun}`}
    >
      {framed && <legend className="legend">New {noun}</legend>}
      <AccountFormFields domain={domain} draft={draft} onChange={setDraft} autoFocus />
      <div className="actions">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button variant="primary" size="sm" onClick={commit} disabled={busy}>
          {busy ? "Saving…" : `Add ${noun}`}
        </Button>
      </div>

      <style jsx>{`
        .creator {
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-width: 0;
          margin: 0;
          padding: 8px 0;
          border: none;
        }

        .creator--framed {
          padding: 12px;
          border: 1px dashed var(--line);
          border-radius: var(--r-sm);
        }

        .legend {
          padding: 0 4px;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--fg-2);
        }

        .actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }
      `}</style>
    </fieldset>
  );
}
