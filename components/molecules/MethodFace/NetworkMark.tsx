type Brand = "mastercard" | "visa" | "amex";

/** Which network mark to draw, if it's one we draw; anything else is text. */
export function networkBrand(network: string): Brand | null {
  const key = network.trim().toLowerCase().replace(/\s+/g, " ");
  if (key === "mastercard" || key === "master card") return "mastercard";
  if (key === "visa") return "visa";
  if (key === "amex" || key === "american express") return "amex";
  return null;
}

interface Props {
  network: string;
  /** sm on a strip, md on the full card. */
  size: "sm" | "md";
}

/**
 * The network's mark, bottom right as on a real card: Mastercard's circles,
 * the VISA wordmark, the Amex box. Any other network keeps its name as
 * text — it's what the owner typed, and we don't draw marks we don't know.
 */
export function NetworkMark({ network, size }: Props) {
  const brand = networkBrand(network);

  return (
    <span className={`mark mark--${size}`} data-brand={brand ?? "text"}>
      {brand === "mastercard" && (
        <svg className="circles" viewBox="0 0 32 20" aria-hidden="true">
          {/* CSS variables don't resolve in SVG presentation attributes; they do in style. */}
          <circle cx="10" cy="10" r="10" style={{ fill: "var(--face-mc-red)" }} />
          <circle cx="22" cy="10" r="10" style={{ fill: "var(--face-mc-yellow)" }} />
          <path
            d="M16 2a10 10 0 0 1 0 16a10 10 0 0 1 0-16z"
            style={{ fill: "var(--face-mc-overlap)" }}
          />
        </svg>
      )}
      {brand === "visa" && <span className="visa">VISA</span>}
      {brand === "amex" && <span className="amex">AMEX</span>}
      {!brand && <span className="text">{network}</span>}

      <style jsx>{`
        .mark {
          display: inline-flex;
          align-items: center;
          min-width: 0;
          max-width: 100%;
          line-height: 1;
        }

        .circles {
          display: block;
          height: 14px;
          width: auto;
        }

        .mark--md .circles {
          height: 24px;
        }

        .visa {
          font-size: 0.85rem;
          font-weight: 900;
          font-style: italic;
          letter-spacing: 0.01em;
          color: var(--ink);
        }

        .mark--md .visa {
          font-size: 1.35rem;
        }

        .amex {
          padding: 3px 5px;
          border-radius: 3px;
          background: var(--face-amex);
          color: var(--face-amex-ink);
          font-size: 0.56rem;
          font-weight: 800;
          letter-spacing: 0.06em;
        }

        .mark--md .amex {
          padding: 5px 7px;
          font-size: 0.72rem;
        }

        .text {
          min-width: 0;
          font-size: 0.78rem;
          font-weight: 800;
          font-style: italic;
          letter-spacing: 0.02em;
          color: var(--ink);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .mark--md .text {
          font-size: 1rem;
        }
      `}</style>
    </span>
  );
}
