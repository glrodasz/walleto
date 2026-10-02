import { useId, useState } from "react";
import { TextField } from "../atoms/TextField";
import { last4Error } from "../../helpers/paymentMethodOptions";

interface Props {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  /** Show the error without waiting for a blur — after a save attempt. */
  showError?: boolean;
}

/**
 * The optional "last 4" of a card, shared by the wizard, the inline method
 * creator and the edit modal. A bare four-digit box next to "Card network"
 * read as the security code — to people and to autofill alike — so it says
 * what it is, opts out of card autofill and explains itself behind an "i".
 */
export function Last4Field({ value, onChange, disabled, showError }: Props) {
  const noteId = useId();
  const [blurred, setBlurred] = useState(false);
  const error = blurred || showError ? last4Error(value) : null;

  return (
    <div className="last4">
      <TextField
        label="Last 4 digits (optional)"
        name="last4"
        autoComplete="off"
        placeholder="e.g. 4242"
        inputMode="numeric"
        maxLength={4}
        value={value}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? noteId : undefined}
        hint="From the card number, not the security code."
        onBlur={() => setBlurred(true)}
        onValueChange={(v) => onChange(v.replace(/\D/g, "").slice(0, 4))}
      />
      {error && (
        <p id={noteId} className="note note--error">
          {error}
        </p>
      )}

      <style jsx>{`
        .last4 {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }

        .note {
          margin: 0;
          font-size: 0.72rem;
          color: var(--fg-2);
        }

        .note--error {
          color: var(--accent-hot);
        }
      `}</style>
    </div>
  );
}
