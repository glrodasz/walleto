import { useState } from "react";
import { Select } from "../atoms/Select";
import { Chip } from "../atoms/Chip";
import { AccountCreator } from "./AccountCreator";
import { ACCOUNT_NOUN, accountLabel } from "../../helpers/accounts";
import type { Account, AccountDomain, Currency } from "../../types";
import type { AccountInput } from "../../schemas";

interface Props {
  domain: AccountDomain;
  /** Already scoped to the domain and sorted. */
  accounts: Account[];
  value: string;
  onChange: (accountId: string) => void;
  /** Resolves to the new account's id, which is selected immediately. */
  createAccount: (input: AccountInput) => Promise<string>;
  /** Seeds the creator's currency select. */
  defaultCurrency: Currency;
  onError?: (message: string) => void;
  disabled?: boolean;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Account / pocket select with an inline creator, for the investment and
 * savings forms. "No account" is a real choice: valuations and interest only
 * make sense per account, and old entries never had one.
 */
export function AccountField({
  domain,
  accounts,
  value,
  onChange,
  createAccount,
  defaultCurrency,
  onError,
  disabled,
}: Props) {
  const noun = ACCOUNT_NOUN[domain].singular;
  const [creating, setCreating] = useState(false);

  const options = [
    { value: "", label: `No ${noun}` },
    ...accounts.map((a) => ({ value: a.id!, label: accountLabel(a) })),
  ];

  if (creating) {
    return (
      <AccountCreator
        domain={domain}
        accounts={accounts}
        defaultCurrency={defaultCurrency}
        createAccount={createAccount}
        onCreated={(id) => {
          onChange(id);
          setCreating(false);
        }}
        onCancel={() => setCreating(false)}
        onError={onError}
      />
    );
  }

  return (
    <div className="account">
      <Select
        label={capitalize(noun)}
        options={options}
        value={value}
        disabled={disabled}
        onValueChange={onChange}
      />
      <div className="account-add">
        {!disabled && (
          <Chip variant="add" onClick={() => setCreating(true)}>
            New {noun}
          </Chip>
        )}
      </div>

      <style jsx>{`
        .account {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .account-add {
          display: flex;
        }
      `}</style>
    </div>
  );
}
