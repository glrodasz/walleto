import { PAYMENT_METHOD_TYPE_LABELS } from "../../../constants";
import { FaceLayout } from "./FaceLayout";
import { slotsFor } from "./slots";
import type { FaceKind, FaceText, MethodFaceProps } from "./types";
import type { PaymentMethodType } from "../../../types";

const KIND: Record<PaymentMethodType, FaceKind> = {
  CREDIT_CARD: "card",
  DEBIT_CARD: "card",
  BANK_TRANSFER: "check",
  DIGITAL_WALLET: "wallet",
  CRYPTO_WALLET: "crypto",
  CASH: "cash",
  OTHER: "ticket",
};

/**
 * A payment method drawn as the thing it is: a card, a check, a wallet app,
 * a hardware wallet, a banknote, a ticket. It's the picture only —
 * decorative and `aria-hidden`; whoever wraps it names it
 * (`MethodFaceButton` + `paymentMethodDescription`).
 *
 * This file is the frame and nothing else: every kind has the same shape
 * (a strip, or a real card's 1.586 when full), corners, edge and shadow,
 * and differs only in its stock and its ink. What's printed on it, and
 * where, is FaceLayout + slots.
 */
export function MethodFace({
  type,
  name,
  network,
  last4,
  currency,
  size = "compact",
  invalid,
}: MethodFaceProps) {
  const kind: FaceKind = type ? KIND[type] : "blank";
  const alias = name.trim();
  const text: FaceText = {
    size,
    title: alias || "Add an alias",
    untitled: !alias,
    typeLabel: type ? PAYMENT_METHOD_TYPE_LABELS[type] : "",
    network: network?.trim() || undefined,
    last4: last4 || undefined,
    currency,
  };

  const classes = [
    "face",
    `face--${kind}`,
    `face--${size}`,
    type === "CREDIT_CARD" ? "face--credit" : "",
    invalid ? "face--invalid" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} aria-hidden="true" data-kind={kind}>
      <FaceLayout size={size} slots={slotsFor(kind, text)} />

      <style jsx>{`
        /* --ink / --ink-soft are what FaceLayout and the ornaments print with. */
        .face {
          --ink: var(--face-ink);
          --ink-soft: var(--face-ink-soft);
          position: relative;
          display: flex;
          width: 100%;
          overflow: hidden;
          isolation: isolate;
          border-radius: var(--r-md);
          box-shadow: var(--face-edge), var(--face-shadow);
          color: var(--ink);
          text-align: left;
          font-variant-numeric: tabular-nums;
        }

        .face--compact {
          min-height: 76px;
        }

        /* ISO/IEC 7810 ID-1 for every kind: a check or a banknote opens to
           the same shape as a card. */
        .face--full {
          max-width: 360px;
          aspect-ratio: 1.586;
          box-shadow: var(--face-edge), var(--face-shadow-lift);
        }

        .face--card {
          background:
            var(--face-gloss), var(--face-guilloche), var(--face-grain), var(--face-debit);
        }

        .face--credit {
          background:
            var(--face-gloss), var(--face-guilloche), var(--face-grain), var(--face-credit);
        }

        /* Ruled security paper, torn off the checkbook along the left. */
        .face--check {
          --ink: var(--face-paper-ink);
          --ink-soft: var(--face-paper-ink-soft);
          background:
            repeating-linear-gradient(0deg, var(--face-paper-line) 0 1px, transparent 1px 7px),
            var(--face-grain), var(--face-paper);
          border-left: 3px dotted var(--face-paper-rule);
        }

        /* A wallet app: its own screen-glow stock, on the same card shape. */
        .face--wallet {
          background: var(--face-gloss), var(--face-grain), var(--face-screen);
        }

        .face--crypto {
          background:
            radial-gradient(var(--face-metal-dot) 1px, transparent 1.5px) 0 0 / 10px 10px,
            var(--face-grain),
            var(--face-metal);
        }

        /* A banknote: its paper, a fine frame printed just inside the edge. */
        .face--cash {
          --ink: var(--face-note-ink);
          --ink-soft: var(--face-note-ink-soft);
          background: var(--face-grain), var(--face-note);
          box-shadow:
            inset 0 0 0 5px var(--face-note),
            inset 0 0 0 6px var(--face-note-rule),
            var(--face-edge),
            var(--face-shadow);
        }

        .face--full.face--cash {
          box-shadow:
            inset 0 0 0 8px var(--face-note),
            inset 0 0 0 9px var(--face-note-rule),
            inset 0 0 0 12px var(--face-note),
            inset 0 0 0 13px var(--face-note-rule),
            var(--face-edge),
            var(--face-shadow-lift);
        }

        /* A ticket: a tear-off stub behind a perforation, kept clear of text. */
        .face--ticket {
          --ink: var(--face-ticket-ink);
          --ink-soft: var(--face-ticket-ink-soft);
          --stub: 44px;
          --reserve: 44px;
          background:
            linear-gradient(to left, var(--face-ticket-stub) var(--stub), transparent var(--stub)),
            var(--face-grain), var(--face-ticket);
        }

        .face--ticket::after {
          content: "";
          position: absolute;
          top: 8px;
          bottom: 8px;
          right: var(--stub);
          border-left: 2px dashed var(--face-ticket-rule);
        }

        .face--full.face--ticket {
          --stub: 64px;
          --reserve: 64px;
        }

        .face--blank {
          --ink: var(--fg-1);
          --ink-soft: var(--fg-2);
          background: var(--glass-inset);
          border: 1.5px dashed var(--line-strong);
          box-shadow: none;
        }

        .face--invalid {
          outline: 2px solid var(--accent-hot);
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}
