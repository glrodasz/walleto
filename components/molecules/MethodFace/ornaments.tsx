import type { ReactNode } from "react";
import { Bitcoin, Coins, Contactless, Plus } from "../../atoms/Icons";
import { NetworkMark } from "./NetworkMark";
import type { MethodFaceSize } from "./types";

/*
 * The things printed on a face. Each one is its own component with its own
 * <style jsx>: slots.tsx hands them to FaceLayout as elements, and a helper
 * that returned a bare <span className> would lose its scope hash.
 * Ink comes from --ink / --ink-soft, which the frame sets per material.
 */

interface Sized {
  size: MethodFaceSize;
}

/** An EMV chip — gold, bevelled, contacts around a central pad — with the tap-to-pay waves. */
export function EmvChip({ size }: Sized) {
  return (
    <span className={`emv emv--${size}`}>
      <span className="chip" />
      {size === "full" && (
        <span className="waves">
          <Contactless size={22} />
        </span>
      )}

      <style jsx>{`
        .emv {
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }

        .chip {
          position: relative;
          display: block;
          width: 34px;
          height: 26px;
          border-radius: 5px;
          background:
            linear-gradient(
              90deg,
              transparent 30%,
              var(--face-chip-line) 30% 32%,
              transparent 32% 68%,
              var(--face-chip-line) 68% 70%,
              transparent 70%
            ),
            linear-gradient(
              0deg,
              transparent 32%,
              var(--face-chip-line) 32% 35%,
              transparent 35% 65%,
              var(--face-chip-line) 65% 68%,
              transparent 68%
            ),
            var(--face-chip);
          box-shadow: var(--face-chip-bevel);
        }

        /* The central contact pad. */
        .chip::before {
          content: "";
          position: absolute;
          left: 32%;
          right: 32%;
          top: 22%;
          bottom: 22%;
          border: 1px solid var(--face-chip-line);
          border-radius: 3px;
          background: var(--face-chip);
        }

        .emv--full .chip {
          width: 46px;
          height: 35px;
          border-radius: 7px;
        }

        .waves {
          display: inline-flex;
          color: var(--ink-soft);
        }
      `}</style>
    </span>
  );
}

/** The embossed number on a full card: silver foil, raised off the plastic. */
export function CardNumber({ last4 }: { last4?: string }) {
  return (
    <span className="number">
      •••• •••• •••• <span className={last4 ? "" : "dim"}>{last4 ?? "••••"}</span>
      <style jsx>{`
        .number {
          display: block;
          font-family: var(--font-mono, "JetBrains Mono", ui-monospace, monospace);
          font-size: 1.12rem;
          letter-spacing: 0.14em;
          white-space: nowrap;
          color: transparent;
          background: var(--face-foil);
          -webkit-background-clip: text;
          background-clip: text;
          /* text-shadow would show through the clipped (transparent) glyphs. */
          filter: var(--face-emboss-drop);
        }

        .dim {
          opacity: 0.55;
        }
      `}</style>
    </span>
  );
}

/** A strip's right column for a card: the network mark over the last 4. */
export function CardAside({ network, last4 }: { network?: string; last4?: string }) {
  return (
    <span className="card-aside">
      {network && <NetworkMark network={network} size="sm" />}
      {last4 && <span className="digits">•••• {last4}</span>}
      <style jsx>{`
        .card-aside {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 5px;
          min-width: 0;
          max-width: 100%;
        }

        .digits {
          font-family: var(--font-mono, "JetBrains Mono", ui-monospace, monospace);
          font-size: 0.85rem;
          font-weight: 500;
          letter-spacing: 0.06em;
          white-space: nowrap;
        }
      `}</style>
    </span>
  );
}

/** An icon in an engraved ring: a bank's seal on a check, a voucher's stamp. */
export function Seal({ size, children }: Sized & { children: ReactNode }) {
  return (
    <span className={`seal seal--${size}`}>
      {children}
      <style jsx>{`
        .seal {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: 1.5px solid currentColor;
          color: var(--ink-soft);
        }

        .seal--full {
          width: 44px;
          height: 44px;
        }
      `}</style>
    </span>
  );
}

/** A wallet app's icon: the provider's initial on a white tile. */
export function AppTile({ size, letter }: Sized & { letter: string }) {
  return (
    <span className={`tile tile--${size}`}>
      {letter}
      <style jsx>{`
        .tile {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 11px;
          background: var(--face-tile);
          color: var(--face-tile-ink);
          font-size: 1rem;
          font-weight: 800;
          box-shadow: var(--face-shadow);
        }

        .tile--full {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          font-size: 1.2rem;
        }
      `}</style>
    </span>
  );
}

/** A coin, for a crypto wallet. */
export function Coin({ size }: Sized) {
  return (
    <span className={`coin coin--${size}`}>
      <Bitcoin size={size === "full" ? 22 : 18} />
      <style jsx>{`
        .coin {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: var(--face-coin);
          color: var(--face-coin-ink);
          box-shadow: var(--face-chip-bevel);
        }

        .coin--full {
          width: 44px;
          height: 44px;
        }
      `}</style>
    </span>
  );
}

/** A banknote's portrait medallion, with its engraved rings. */
export function Medallion({ size }: Sized) {
  return (
    <span className={`medal medal--${size}`}>
      <Coins size={size === "full" ? 22 : 20} />
      <style jsx>{`
        .medal {
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

        .medal--full {
          width: 44px;
          height: 44px;
        }
      `}</style>
    </span>
  );
}

/** A check's "Pay to the order of ______ [   ]". */
export function PayLine() {
  return (
    <span className="pay">
      <span className="label">Pay to the order of</span>
      <span className="rule" />
      <span className="amount" />
      <style jsx>{`
        .pay {
          display: flex;
          align-items: flex-end;
          gap: 8px;
        }

        .label {
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--ink-soft);
          white-space: nowrap;
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
      `}</style>
    </span>
  );
}

/** A check's memo line; on a strip, a stamped box. */
export function Memo({ size, value }: Sized & { value: string }) {
  return (
    <span className={`memo memo--${size}`}>
      <span className="label">Memo</span>
      <span className="value">{value}</span>
      <style jsx>{`
        .memo {
          display: flex;
          min-width: 0;
        }

        .memo--full {
          align-items: flex-end;
          gap: 8px;
        }

        .memo--compact {
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
          padding: 4px 8px;
          border: 1px dashed var(--face-paper-rule);
          border-radius: 4px;
        }

        .label {
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--ink-soft);
        }

        .value {
          min-width: 0;
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: normal;
          color: var(--ink);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .memo--full .value {
          padding-right: 12px;
          border-bottom: 1px solid var(--face-paper-rule);
        }
      `}</style>
    </span>
  );
}

/** The line a check is signed on. */
export function SignatureLine() {
  return (
    <span className="sign">
      <style jsx>{`
        .sign {
          display: block;
          width: 110px;
          border-bottom: 1px solid var(--face-paper-rule);
        }
      `}</style>
    </span>
  );
}

/** A draft with no type yet: a dashed ring with a plus. */
export function BlankRing({ size }: Sized) {
  return (
    <span className={`ring ring--${size}`}>
      <Plus size={18} />
      <style jsx>{`
        .ring {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: 1.5px dashed var(--line-strong);
          color: var(--fg-2);
        }

        .ring--full {
          width: 44px;
          height: 44px;
        }
      `}</style>
    </span>
  );
}
