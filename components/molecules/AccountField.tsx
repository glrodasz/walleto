import { useState } from "react";
import { Select } from "../atoms/Select";
import { TextField } from "../atoms/TextField";
import { Button } from "../atoms/Button";
import { Chip } from "../atoms/Chip";
import { ACCOUNT_NOUN } from "../../helpers/accounts";
import { SELECTABLE_CURRENCIES, CURRENCY_SYMBOL } from "../../constants";
import type { Account, AccountDomain, Currency, InterestPeriod } from "../../types";
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

const CURRENCY_OPTIONS = SELECTABLE_CURRENCIES.map((c) => ({
  value: c.value,
  label: `${CURRENCY_SYMBOL[c.value]} ${c.label}`,
}));

const PERIOD_OPTIONS: { value: InterestPeriod; label: string }[] = [
  { value: "YEARLY", label: "Yearly" },
  { value: "MONTHLY", label: "Monthly" },
];

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
  const label = capitalize(noun);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [provider, setProvider] = useState("");
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);
  const [rate, setRate] = useState("");
  const [period, setPeriod] = useState<InterestPeriod>("YEARLY");

  const options = [
    { value: "", label: `No ${noun}` },
    ...accounts.map((a) => ({ value: a.id!, label: a.name })),
  ];

  const open = () => {
    setName("");
    setProvider("");
    setCurrency(defaultCurrency);
    setRate("");
    setPeriod("YEARLY");
    setCreating(true);
  };

  const commit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return onError?.(`Give the ${noun} a name`);
    const existing = accounts.find((a) => a.name.toLowerCase() === trimmed.toLowerCase());
    if (existing?.id) {
      onChange(existing.id);
      setCreating(false);
      return;
    }
    const rateValue = rate.trim() === "" ? null : Number(rate);
    if (rateValue !== null && !(rateValue >= 0 && rateValue <= 100)) {
      return onError?.("Interest rate must be between 0 and 100");
    }
    setBusy(true);
    try {
      const id = await createAccount({
        domain,
        name: trimmed,
        currency,
        ...(provider.trim() ? { provider: provider.trim() } : {}),
        ...(rateValue !== null ? { interestRate: { value: rateValue, period } } : {}),
      });
      onChange(id);
      setCreating(false);
    } catch (err) {
      console.error("Failed to create account:", err);
      onError?.(`Couldn't create the ${noun} "${trimmed}"`);
    } finally {
      setBusy(false);
    }
  };

  if (creating) {
    return (
      <fieldset className="creator">
        <legend className="legend">New {noun}</legend>
        <TextField
          label="Name"
          placeholder={domain === "SAVING" ? "Emergency fund" : "Broker account"}
          autoFocus
          value={name}
          onValueChange={setName}
        />
        <div className="pair">
          <TextField
            label="Bank or broker (optional)"
            placeholder="Avanza"
            value={provider}
            onValueChange={setProvider}
          />
          <Select
            label="Currency"
            options={CURRENCY_OPTIONS}
            value={currency}
            onValueChange={(v) => setCurrency(v as Currency)}
          />
        </div>
        <div className="pair">
          <TextField
            label="Interest rate % (optional)"
            placeholder="0"
            inputMode="decimal"
            align="right"
            value={rate}
            onValueChange={(v) => setRate(v.replace(/[^\d.]/g, ""))}
          />
          <Select
            label="Rate period"
            options={PERIOD_OPTIONS}
            value={period}
            onValueChange={(v) => setPeriod(v as InterestPeriod)}
          />
        </div>
        <div className="actions">
          <Button variant="ghost" size="sm" onClick={() => setCreating(false)} disabled={busy}>
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
            margin: 0;
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

          .pair {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }

          .actions {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
          }

          @media (max-width: 480px) {
            .pair {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </fieldset>
    );
  }

  return (
    <div className="account">
      <Select
        label={label}
        options={options}
        value={value}
        disabled={disabled}
        onValueChange={onChange}
      />
      <div className="account-add">
        {!disabled && (
          <Chip variant="add" onClick={open}>
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
