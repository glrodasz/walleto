import { PAYMENT_METHOD_TYPE_LABELS } from "../../constants";
import { Bitcoin, Coins, Landmark, Plus, Wallet } from "../atoms/Icons";
import type { Currency, PaymentMethodType } from "../../types";

export type MethodFaceSize = "compact" | "full";

interface Props {
  /** "" is a draft that hasn't picked a type yet: a dashed placeholder. */
  type: PaymentMethodType | "";
  name: string;
  network?: string;
  last4?: string;
  /** Printed in the corners of a banknote. */
  currency?: Currency;
  /** A strip for lists and the collapsed wallet; the whole object when open. */
  size?: MethodFaceSize;
  /** A save attempt found a problem on this method. */
  invalid?: boolean;
}

type Kind = "card" | "check" | "phone" | "crypto" | "cash" | "ticket" | "blank";

const KIND: Record<PaymentMethodType, Kind> = {
  CREDIT_CARD: "card",
  DEBIT_CARD: "card",
  BANK_TRANSFER: "check",
  DIGITAL_WALLET: "phone",
  CRYPTO_WALLET: "crypto",
  CASH: "cash",
  OTHER: "ticket",
};

/** What every face prints; each kind lays it out on its own stock. */
interface FaceText {
  size: MethodFaceSize;
  /** The alias, or a muted prompt when there isn't one yet. */
  title: string;
  untitled: boolean;
  typeLabel: string;
  network?: string;
  last4?: string;
  currency?: Currency;
}

/**
 * A payment method drawn as the thing it is: a card, a check, a phone, a
 * hardware wallet, a banknote, a ticket. It's the picture only — decorative
 * and `aria-hidden`; whoever wraps it names it (`paymentMethodDescription`).
 *
 * The frame (stock, size, shadow) lives here; each kind's content is its own
 * component with its own `<style jsx>`, never a helper returning JSX.
 */
export function MethodFace({
  type,
  name,
  network,
  last4,
  currency,
  size = "compact",
  invalid,
}: Props) {
  const kind: Kind = type ? KIND[type] : "blank";
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
      {kind === "card" && <CardFace {...text} />}
      {kind === "check" && <CheckFace {...text} />}
      {kind === "phone" && <PhoneFace {...text} />}
      {kind === "crypto" && <CryptoFace {...text} />}
      {kind === "cash" && <CashFace {...text} />}
      {kind === "ticket" && <TicketFace {...text} />}
      {kind === "blank" && <BlankFace size={size} />}

      <style jsx>{`
        .face {
          position: relative;
          display: flex;
          width: 100%;
          overflow: hidden;
          isolation: isolate;
          border-radius: var(--r-md);
          box-shadow: var(--face-shadow);
          color: var(--face-ink);
          text-align: left;
          font-variant-numeric: tabular-nums;
          transition: box-shadow 180ms ease;
        }

        .face--compact {
          min-height: 76px;
        }

        .face--full {
          max-width: 360px;
          aspect-ratio: 2;
          border-radius: var(--r-lg);
          box-shadow: var(--face-shadow-lift);
        }

        /* ISO/IEC 7810 ID-1: the proportions everyone knows a card by. */
        .face--card.face--full {
          aspect-ratio: 1.586;
        }

        .face--card {
          background: var(--face-sheen), var(--face-debit);
        }

        .face--credit {
          background: var(--face-sheen), var(--face-credit);
        }

        /* Ruled security paper, torn off the checkbook along the left. */
        .face--check {
          background:
            repeating-linear-gradient(0deg, var(--face-paper-line) 0 1px, transparent 1px 7px),
            var(--face-paper);
          color: var(--face-paper-ink);
          border-left: 3px dotted var(--face-paper-rule);
        }

        /* A phone held sideways: bezel, with the camera on the left. */
        .face--phone {
          background: var(--face-bezel);
          padding: 5px 5px 5px 16px;
        }

        .face--phone::before {
          content: "";
          position: absolute;
          left: 6px;
          top: 50%;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--face-ink-soft);
          opacity: 0.5;
          transform: translateY(-50%);
        }

        .face--full.face--phone {
          padding: 8px 8px 8px 22px;
          border-radius: var(--r-xl);
        }

        .face--full.face--phone::before {
          left: 8px;
          width: 6px;
          height: 6px;
        }

        .face--crypto {
          background:
            radial-gradient(var(--face-metal-dot) 1px, transparent 1.5px) 0 0 / 10px 10px,
            var(--face-metal);
        }

        /* A banknote: its paper, a fine frame printed just inside the edge. */
        .face--cash {
          background: var(--face-note);
          color: var(--face-note-ink);
          box-shadow:
            inset 0 0 0 5px var(--face-note),
            inset 0 0 0 6px var(--face-note-rule),
            var(--face-shadow);
        }

        .face--full.face--cash {
          box-shadow:
            inset 0 0 0 8px var(--face-note),
            inset 0 0 0 9px var(--face-note-rule),
            inset 0 0 0 12px var(--face-note),
            inset 0 0 0 13px var(--face-note-rule),
            var(--face-shadow-lift);
        }

        .face--ticket {
          background: var(--face-ticket);
          color: var(--face-ticket-ink);
        }

        .face--blank {
          background: var(--glass-inset);
          border: 1.5px dashed var(--line-strong);
          box-shadow: none;
          color: var(--fg-1);
        }

        .face--invalid {
          outline: 2px solid var(--accent-hot);
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}

interface ButtonProps extends Props {
  /** The spoken name — the face itself is aria-hidden. */
  label: string;
  onClick: () => void;
  /** For a face that opens and closes something (the wallet's editor). */
  expanded?: boolean;
  controls?: string;
}

/** A face you can tap: lifts under the pointer, sinks when pressed. */
export function MethodFaceButton({ label, onClick, expanded, controls, ...face }: ButtonProps) {
  return (
    <button
      type="button"
      className={`face-button face-button--${face.size ?? "compact"}`}
      aria-label={label}
      aria-expanded={expanded}
      aria-controls={controls}
      onClick={onClick}
    >
      <MethodFace {...face} />

      <style jsx>{`
        .face-button {
          display: block;
          width: 100%;
          padding: 0;
          border: none;
          background: none;
          color: inherit;
          font: inherit;
          text-align: left;
          cursor: pointer;
          border-radius: var(--r-md);
          transition: transform 180ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .face-button--full {
          max-width: 360px;
          border-radius: var(--r-lg);
        }

        .face-button:hover {
          transform: translateY(-1px);
        }

        .face-button:active {
          transform: scale(0.99);
        }

        .face-button:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 3px;
        }

        @media (prefers-reduced-motion: reduce) {
          .face-button {
            transition: none;
          }

          .face-button:hover,
          .face-button:active {
            transform: none;
          }
        }
      `}</style>
    </button>
  );
}

function CardFace({ size, title, untitled, typeLabel, network, last4 }: FaceText) {
  // "Debit card" → "Debit": the card itself only says which kind it is.
  const kindWord = typeLabel.replace(/ card$/i, "");
  const full = size === "full";

  return (
    <div className={`card card--${size}`}>
      {full && <span className="kind">{kindWord}</span>}
      <span className="chip" />
      <span className={`title${untitled ? " title--muted" : ""}`}>{title}</span>
      {!full && <span className="kind">{kindWord}</span>}
      {network && <span className="brand">{network}</span>}
      {full ? (
        <span className="digits">
          •••• •••• •••• <span className={last4 ? "" : "soft"}>{last4 ?? "••••"}</span>
        </span>
      ) : (
        last4 && <span className="digits">•••• {last4}</span>
      )}

      <style jsx>{`
        .card {
          flex: 1;
          min-width: 0;
          display: grid;
          align-content: center;
          column-gap: 12px;
          row-gap: 2px;
        }

        .card--compact {
          grid-template-columns: auto minmax(0, 1fr) auto;
          grid-template-areas:
            "chip title brand"
            "chip kind digits";
          padding: 12px 14px;
        }

        .card--full {
          grid-template-columns: minmax(0, 1fr) auto;
          grid-template-rows: auto 1fr auto auto;
          grid-template-areas:
            "kind brand"
            "chip ."
            "digits digits"
            "title title";
          align-content: stretch;
          row-gap: 6px;
          padding: 18px 20px;
        }

        .chip {
          grid-area: chip;
          width: 34px;
          height: 26px;
          border-radius: 6px;
          background:
            linear-gradient(
              90deg,
              transparent 32%,
              var(--face-chip-line) 32% 35%,
              transparent 35% 65%,
              var(--face-chip-line) 65% 68%,
              transparent 68%
            ),
            linear-gradient(0deg, transparent 46%, var(--face-chip-line) 46% 54%, transparent 54%),
            var(--face-chip);
        }

        .card--full .chip {
          align-self: center;
          width: 42px;
          height: 32px;
          border-radius: 7px;
        }

        .title {
          grid-area: title;
          min-width: 0;
          font-size: 0.95rem;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* The cardholder line: raised capitals. */
        .card--full .title {
          font-size: 0.9rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          text-shadow: var(--face-emboss);
        }

        .title--muted {
          color: var(--face-ink-soft);
          font-weight: 500;
        }

        .kind {
          grid-area: kind;
          font-size: 0.64rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--face-ink-soft);
        }

        .card--full .kind {
          font-size: 0.7rem;
        }

        .brand {
          grid-area: brand;
          justify-self: end;
          max-width: 9rem;
          font-size: 0.78rem;
          font-weight: 800;
          font-style: italic;
          letter-spacing: 0.02em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .card--full .brand {
          font-size: 1rem;
        }

        .digits {
          grid-area: digits;
          justify-self: end;
          font-family: var(--font-mono, "JetBrains Mono", ui-monospace, monospace);
          font-size: 0.85rem;
          letter-spacing: 0.06em;
          white-space: nowrap;
        }

        .card--full .digits {
          justify-self: start;
          font-size: 1.1rem;
          letter-spacing: 0.12em;
          text-shadow: var(--face-emboss);
        }

        .soft {
          color: var(--face-ink-soft);
        }
      `}</style>
    </div>
  );
}

function CheckFace({ size, title, untitled, typeLabel, network }: FaceText) {
  const full = size === "full";

  return (
    <div className={`check check--${size}`}>
      <span className="seal">
        <Landmark size={full ? 20 : 18} />
      </span>
      <span className={`title${untitled ? " title--muted" : ""}`}>{title}</span>
      <span className="kind">{typeLabel}</span>
      {full && (
        <span className="pay">
          <span className="label">Pay to the order of</span>
          <span className="rule" />
          <span className="amount" />
        </span>
      )}
      {(network || full) && (
        <span className="memo">
          <span className="label">Memo</span>
          <span className="memo-value">{network ?? ""}</span>
        </span>
      )}
      {full && <span className="sign" />}

      <style jsx>{`
        .check {
          flex: 1;
          min-width: 0;
          display: grid;
          align-content: center;
          column-gap: 12px;
          row-gap: 2px;
        }

        .check--compact {
          grid-template-columns: auto minmax(0, 1fr) auto;
          grid-template-areas:
            "seal title memo"
            "seal kind memo";
          padding: 12px 14px;
        }

        .check--full {
          grid-template-columns: auto minmax(0, 1fr) auto;
          grid-template-rows: auto 1fr auto;
          grid-template-areas:
            "seal title kind"
            "pay pay pay"
            "memo memo sign";
          align-content: stretch;
          align-items: end;
          row-gap: 10px;
          padding: 16px 18px;
        }

        .seal {
          grid-area: seal;
          align-self: center;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: 1.5px solid var(--face-paper-rule);
        }

        .check--full .seal {
          width: 36px;
          height: 36px;
        }

        .title {
          grid-area: title;
          min-width: 0;
          align-self: center;
          font-size: 0.95rem;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .title--muted {
          color: var(--face-paper-ink-soft);
          font-weight: 500;
        }

        .kind {
          grid-area: kind;
          font-size: 0.75rem;
          color: var(--face-paper-ink-soft);
        }

        .check--full .kind {
          align-self: center;
          font-size: 0.64rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .label {
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--face-paper-ink-soft);
          white-space: nowrap;
        }

        .pay {
          grid-area: pay;
          display: flex;
          align-items: flex-end;
          gap: 8px;
        }

        .rule {
          flex: 1;
          border-bottom: 1px solid var(--face-paper-rule);
        }

        .amount {
          width: 64px;
          height: 22px;
          border: 1px solid var(--face-paper-rule);
          border-radius: 4px;
        }

        /* Compact: the method rides in a stamped memo box on the right. */
        .memo {
          grid-area: memo;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
          min-width: 0;
          max-width: 9rem;
          align-self: center;
          padding: 4px 8px;
          border: 1px dashed var(--face-paper-rule);
          border-radius: 4px;
        }

        .check--full .memo {
          flex-direction: row;
          align-items: flex-end;
          gap: 8px;
          max-width: none;
          padding: 0;
          border: none;
          align-self: end;
        }

        .memo-value {
          min-width: 0;
          font-size: 0.8rem;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .check--full .memo-value {
          flex: 1;
          min-height: 1.2em;
          border-bottom: 1px solid var(--face-paper-rule);
        }

        .sign {
          grid-area: sign;
          width: 110px;
          border-bottom: 1px solid var(--face-paper-rule);
        }
      `}</style>
    </div>
  );
}

function PhoneFace({ size, title, untitled, typeLabel, network }: FaceText) {
  const initial = (network || (untitled ? "" : title) || "•").charAt(0).toUpperCase();
  const meta = network && network !== title ? network : typeLabel;

  return (
    <div className={`screen screen--${size}`}>
      <span className="tile">{initial}</span>
      <span className={`title${untitled ? " title--muted" : ""}`}>{title}</span>
      <span className="meta">{meta}</span>
      {size === "full" && <span className="home" />}

      <style jsx>{`
        .screen {
          position: relative;
          flex: 1;
          min-width: 0;
          display: grid;
          align-content: center;
          column-gap: 12px;
          row-gap: 2px;
          border-radius: 8px;
          background: var(--face-sheen), var(--face-screen);
        }

        .screen--compact {
          grid-template-columns: auto minmax(0, 1fr);
          grid-template-areas:
            "tile title"
            "tile meta";
          padding: 8px 12px;
        }

        .screen--full {
          grid-template-columns: minmax(0, 1fr);
          grid-template-areas:
            "tile"
            "title"
            "meta";
          justify-items: center;
          text-align: center;
          row-gap: 4px;
          border-radius: 16px;
          padding: 16px;
        }

        .tile {
          grid-area: tile;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: var(--face-tile);
          color: var(--face-tile-ink);
          font-weight: 800;
          font-size: 1rem;
        }

        .screen--full .tile {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          font-size: 1.4rem;
          margin-bottom: 6px;
        }

        .title {
          grid-area: title;
          min-width: 0;
          max-width: 100%;
          font-size: 0.95rem;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .title--muted {
          color: var(--face-ink-soft);
          font-weight: 500;
        }

        .meta {
          grid-area: meta;
          min-width: 0;
          max-width: 100%;
          font-size: 0.75rem;
          color: var(--face-ink-soft);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .home {
          position: absolute;
          left: 50%;
          bottom: 7px;
          width: 64px;
          height: 4px;
          border-radius: 999px;
          background: var(--face-ink-soft);
          transform: translateX(-50%);
        }
      `}</style>
    </div>
  );
}

function CryptoFace({ size, title, untitled, typeLabel }: FaceText) {
  const full = size === "full";

  return (
    <div className={`device device--${size}`}>
      <span className="coin">
        <Bitcoin size={full ? 22 : 18} />
      </span>
      {full ? (
        <span className="lcd">
          <span className={`title${untitled ? " title--muted" : ""}`}>{title}</span>
        </span>
      ) : (
        <span className={`title${untitled ? " title--muted" : ""}`}>{title}</span>
      )}
      <span className="meta">{typeLabel}</span>
      {full && (
        <span className="keys">
          <span className="key" />
          <span className="key" />
        </span>
      )}

      <style jsx>{`
        .device {
          flex: 1;
          min-width: 0;
          display: grid;
          align-content: center;
          column-gap: 12px;
          row-gap: 2px;
        }

        .device--compact {
          grid-template-columns: auto minmax(0, 1fr);
          grid-template-areas:
            "coin title"
            "coin meta";
          padding: 12px 14px;
        }

        .device--full {
          grid-template-columns: auto minmax(0, 1fr) auto;
          grid-template-rows: auto 1fr auto;
          grid-template-areas:
            "coin . ."
            "lcd lcd keys"
            "meta meta meta";
          align-content: stretch;
          align-items: center;
          row-gap: 10px;
          padding: 16px 18px;
        }

        .coin {
          grid-area: coin;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: var(--face-coin);
          color: var(--face-coin-ink);
        }

        .lcd {
          grid-area: lcd;
          min-width: 0;
          padding: 10px 12px;
          border-radius: 6px;
          background: var(--face-lcd);
          color: var(--face-lcd-ink);
          font-family: var(--font-mono, "JetBrains Mono", ui-monospace, monospace);
        }

        .title {
          grid-area: title;
          display: block;
          min-width: 0;
          font-size: 0.95rem;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .title--muted {
          color: var(--face-ink-soft);
          font-weight: 500;
        }

        .lcd .title--muted {
          color: inherit;
          opacity: 0.7;
        }

        .meta {
          grid-area: meta;
          font-size: 0.75rem;
          color: var(--face-ink-soft);
        }

        .device--full .meta {
          font-size: 0.64rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .keys {
          grid-area: keys;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .key {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--face-metal-dot);
          box-shadow: inset 0 0 0 1px var(--face-ink-soft);
          opacity: 0.6;
        }
      `}</style>
    </div>
  );
}

function CashFace({ size, title, untitled, typeLabel, currency }: FaceText) {
  const full = size === "full";

  return (
    <div className={`note note--${size}`}>
      <span className="medal">
        <Coins size={full ? 26 : 20} />
      </span>
      <span className={`title${untitled ? " title--muted" : ""}`}>{title}</span>
      <span className="meta">{typeLabel}</span>
      {currency && <span className="corner">{currency}</span>}
      {currency && full && <span className="corner corner--end">{currency}</span>}

      <style jsx>{`
        .note {
          position: relative;
          flex: 1;
          min-width: 0;
          display: grid;
          align-content: center;
          column-gap: 12px;
          row-gap: 2px;
        }

        .note--compact {
          grid-template-columns: auto minmax(0, 1fr) auto;
          grid-template-areas:
            "medal title corner"
            "medal meta corner";
          padding: 14px 18px;
        }

        .note--full {
          grid-template-columns: auto minmax(0, 1fr);
          grid-template-areas:
            "medal title"
            "medal meta";
          column-gap: 16px;
          padding: 24px 28px;
        }

        /* The portrait medallion, with the note's engraved rings behind it. */
        .medal {
          grid-area: medal;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1.5px solid var(--face-note-rule);
          background: repeating-radial-gradient(
            circle,
            transparent 0 3px,
            var(--face-note-rule) 3px 3.5px
          );
        }

        .note--full .medal {
          width: 64px;
          height: 64px;
        }

        .title {
          grid-area: title;
          min-width: 0;
          font-size: 0.95rem;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .note--full .title {
          font-size: 1.05rem;
        }

        .title--muted {
          color: var(--face-note-ink-soft);
          font-weight: 500;
        }

        .meta {
          grid-area: meta;
          font-size: 0.75rem;
          color: var(--face-note-ink-soft);
        }

        .corner {
          grid-area: corner;
          align-self: center;
          font-size: 0.8rem;
          font-weight: 800;
          letter-spacing: 0.06em;
        }

        .note--full .corner {
          position: absolute;
          top: 16px;
          left: 20px;
          font-size: 0.72rem;
        }

        .note--full .corner--end {
          top: auto;
          left: auto;
          bottom: 16px;
          right: 20px;
        }
      `}</style>
    </div>
  );
}

function TicketFace({ size, title, untitled, typeLabel }: FaceText) {
  const full = size === "full";

  return (
    <div className={`ticket ticket--${size}`}>
      <span className="main">
        <span className={`title${untitled ? " title--muted" : ""}`}>{title}</span>
        <span className="meta">{typeLabel}</span>
      </span>
      <span className="stub">
        <Wallet size={full ? 26 : 20} />
      </span>

      <style jsx>{`
        .ticket {
          flex: 1;
          min-width: 0;
          display: flex;
        }

        .main {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 2px;
          padding: 12px 14px;
        }

        .ticket--full .main {
          justify-content: flex-end;
          padding: 20px;
        }

        .title {
          min-width: 0;
          font-size: 0.95rem;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .ticket--full .title {
          font-size: 1.05rem;
        }

        .title--muted {
          color: var(--face-ticket-ink-soft);
          font-weight: 500;
        }

        .meta {
          font-size: 0.75rem;
          color: var(--face-ticket-ink-soft);
        }

        /* The tear-off stub, behind a perforation. */
        .stub {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 56px;
          background: var(--face-ticket-stub);
          border-left: 2px dashed var(--face-ticket-rule);
        }

        .ticket--full .stub {
          width: 84px;
        }
      `}</style>
    </div>
  );
}

function BlankFace({ size }: { size: MethodFaceSize }) {
  return (
    <div className={`blank blank--${size}`}>
      <span className="ring">
        <Plus size={18} />
      </span>
      <span className="text">
        <span className="title">New payment method</span>
        <span className="meta">Choose a type</span>
      </span>

      <style jsx>{`
        .blank {
          flex: 1;
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
        }

        .blank--full {
          flex-direction: column;
          justify-content: center;
          text-align: center;
        }

        .ring {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          flex-shrink: 0;
          border-radius: 50%;
          border: 1.5px dashed var(--line-strong);
          color: var(--fg-2);
        }

        .text {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .title {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--fg-1);
        }

        .meta {
          font-size: 0.75rem;
          color: var(--fg-2);
        }
      `}</style>
    </div>
  );
}
