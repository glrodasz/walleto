import { useState } from "react";
import { Button } from "../../../components/atoms/Button";
import { TextField } from "../../../components/atoms/TextField";
import { Modal } from "../../../components/molecules/Modal";
import { useDeleteAccount } from "../hooks/useDeleteAccount";

const CONFIRM_WORD = "DELETE";

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * The one irreversible action in the app, so it asks for the word to be typed
 * rather than a second click. What goes is spelled out; the sign-in identity
 * may outlive it (docs/compliance.md), so that is said too.
 */
export function DeleteAccountModal({ open, onClose }: Props) {
  const [typed, setTyped] = useState("");
  const { deleteAccount, deleting, error } = useDeleteAccount();
  const armed = typed.trim() === CONFIRM_WORD;

  const close = () => {
    if (deleting) return;
    setTyped("");
    onClose();
  };

  return (
    <Modal open={open} title="Delete your account" onClose={close}>
      <div className="form">
        <p className="body">
          This erases everything Waletto holds about you: categories, tags, payment methods,
          accounts and pockets, recurring items, every transaction and every value check, and your
          settings. You will be signed out. <strong>It cannot be undone.</strong>
        </p>
        <p className="body">
          If you want a copy first, download your data from Settings › Data &amp; privacy before
          deleting.
        </p>
        <TextField
          label={`Type ${CONFIRM_WORD} to confirm`}
          placeholder={CONFIRM_WORD}
          autoComplete="off"
          value={typed}
          onValueChange={setTyped}
        />
        {error && <p className="form-error">{error}</p>}
        <div className="actions">
          <Button variant="ghost" onClick={close} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={deleteAccount} disabled={!armed || deleting}>
            {deleting ? "Deleting…" : "Delete everything"}
          </Button>
        </div>
      </div>

      <style jsx>{`
        .form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .body {
          margin: 0;
          font-size: 0.9rem;
          line-height: 1.5;
          color: var(--fg-1);
        }

        .form-error {
          margin: 0;
          font-size: 0.85rem;
          color: var(--accent-hot);
        }

        .actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          position: sticky;
          bottom: 0;
        }
      `}</style>
    </Modal>
  );
}
