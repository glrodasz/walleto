import { useState } from "react";
import { Card } from "../../../components/atoms/Card";
import { SectionTitle } from "../../../components/atoms/SectionTitle";
import { Button } from "../../../components/atoms/Button";
import { Chip } from "../../../components/atoms/Chip";
import { KebabMenu } from "../../../components/molecules/KebabMenu";
import { TabStrip } from "../../../components/atoms/TabStrip";
import { Pager } from "../../../components/molecules/Pager";
import { paginate } from "../../../utils/paginate";
import { AccountCreator } from "../../../components/molecules/AccountCreator";
import { AccountFormFields } from "../../../components/molecules/AccountFormFields";
import { ErrorState } from "../../../components/atoms/ErrorState";
import { useAccounts } from "../../../hooks/useAccounts";
import { useUserDoc } from "../../../hooks/useUserDoc";
import { ACCOUNT_NOUN, accountLabel, formatInterestRate } from "../../../helpers/accounts";
import { DOMAIN_CONFIG } from "../../domains/helpers/domainConfig";
import { useDecimalInput } from "../../../hooks/useDecimalInput";
import { accountDraftOf, readAccountDraft } from "../../../helpers/accountDraft";
import type { AccountDraft } from "../../../helpers/accountDraft";
import type { Account, AccountDomain } from "../../../types";

const DOMAINS: AccountDomain[] = ["INVESTMENT", "SAVING", "DEBT"];
const PAGE_SIZE = 25;

/**
 * Investment accounts, savings pockets and debts: create, rename, change the
 * bank or broker (the lender), the currency and the interest rate, or
 * archive. The entry forms offer the same creator inline.
 */
export function AccountsSettings() {
  const [domain, setDomain] = useState<AccountDomain>("INVESTMENT");
  const { accounts, loading, error, create, update, remove } = useAccounts(domain);
  const { userDoc } = useUserDoc();
  const decimal = useDecimalInput();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<AccountDraft | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const noun = ACCOUNT_NOUN[domain].singular;
  const paged = paginate(accounts, page, PAGE_SIZE);

  const run = async (id: string, action: () => Promise<void>, failure: string) => {
    setBusyId(id);
    setMessage(null);
    try {
      await action();
    } catch (err) {
      console.error(failure, err);
      setMessage(failure);
    } finally {
      setBusyId(null);
    }
  };

  const startEdit = (a: Account) => {
    setEditingId(a.id!);
    setDraft(accountDraftOf(a, decimal.toInput));
    setMessage(null);
  };

  const save = async () => {
    const id = editingId;
    const d = draft;
    if (!id || !d) return;
    const read = readAccountDraft(d, decimal.parse, noun);
    if ("error" in read) return setMessage(read.error);
    setEditingId(null);
    await run(id, () => update(id, read.values), `Couldn't update the ${noun}`);
  };

  return (
    <Card>
      <SectionTitle title="Accounts & debts" />
      <TabStrip
        label="Domain"
        tabs={DOMAINS.map((d) => ({
          key: d,
          label: DOMAIN_CONFIG[d].title,
          accent: DOMAIN_CONFIG[d].accent,
        }))}
        value={domain}
        onChange={(d) => {
          setDomain(d as AccountDomain);
          setPage(1);
          setEditingId(null);
          setCreating(false);
          setMessage(null);
        }}
      />

      {error && <ErrorState error={error} />}

      {loading ? (
        <p className="hint">Loading…</p>
      ) : (
        <ul className="list">
          {paged.rows.map((a) => (
            <li key={a.id} className="row">
              {editingId === a.id && draft ? (
                <form
                  className="edit"
                  onSubmit={(e) => {
                    e.preventDefault();
                    save();
                  }}
                >
                  <AccountFormFields domain={domain} draft={draft} onChange={setDraft} autoFocus />
                  <div className="actions">
                    <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" size="sm">
                      Save
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <span className="main">
                    <span className="name">{accountLabel(a)}</span>
                    <span className="meta">
                      {a.currency}
                      {a.interestRate
                        ? ` · ${formatInterestRate(a.interestRate, decimal.separator)}`
                        : ""}
                    </span>
                  </span>
                  <KebabMenu
                    aria-label={`Actions for ${a.name}`}
                    actions={[
                      { label: "Edit", onSelect: () => startEdit(a) },
                      {
                        label: busyId === a.id ? "Archiving…" : "Archive",
                        onSelect: () =>
                          a.id && run(a.id, () => remove(a.id!), `Couldn't archive the ${noun}`),
                        danger: true,
                        disabled: busyId === a.id,
                      },
                    ]}
                  />
                </>
              )}
            </li>
          ))}
          {accounts.length === 0 && <li className="hint">No {noun}s yet</li>}
        </ul>
      )}

      <Pager page={paged.page} pageCount={paged.pageCount} onChange={setPage} />

      <div className="add">
        {creating ? (
          <AccountCreator
            domain={domain}
            accounts={accounts}
            defaultCurrency={userDoc?.mainCurrency ?? "USD"}
            createAccount={create}
            framed={false}
            onCreated={() => setCreating(false)}
            onCancel={() => setCreating(false)}
            onError={setMessage}
          />
        ) : (
          <Chip
            variant="add"
            onClick={() => {
              setCreating(true);
              setMessage(null);
            }}
          >
            Add {noun}
          </Chip>
        )}
      </div>

      {message && (
        <p className="message" role="alert">
          {message}
        </p>
      )}

      <style jsx>{`
        .list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
        }

        .row {
          display: flex;
          align-items: center;
          gap: 8px;
          min-height: 44px;
          border-bottom: 1px solid var(--line);
        }

        .row:last-child {
          border-bottom: none;
        }

        .main {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 8px 0;
        }

        .name {
          font-size: 0.9rem;
          color: var(--fg-0);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .meta {
          font-size: 0.72rem;
          color: var(--fg-2);
        }

        .edit {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 8px 0;
        }

        .actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

        .add {
          margin-top: 12px;
        }

        .hint {
          margin: 0;
          font-size: 0.85rem;
          color: var(--fg-2);
        }

        .message {
          margin: 10px 0 0;
          font-size: 0.85rem;
          color: var(--accent-hot);
        }
      `}</style>
    </Card>
  );
}
