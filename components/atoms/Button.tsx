import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  children: ReactNode;
  variant?: Variant;
  size?: "sm" | "md";
}

export function Button({
  children,
  variant = "secondary",
  size = "md",
  type = "button",
  className,
  ...rest
}: Props) {
  // Solid and ghost buttons are glass; the primary one is accent-coloured, so
  // it takes the sheen and the press response without the translucent fill.
  const material = variant === "secondary" ? "glass glass--tap " : "";

  return (
    <button
      type={type}
      className={`${material}btn btn--${variant} btn--${size}${className ? ` ${className}` : ""}`}
      {...rest}
    >
      {children}

      <style jsx>{`
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: var(--r-pill);
          border: 1px solid transparent;
          font-family: inherit;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition:
            background-color 180ms ease,
            border-color 180ms ease,
            box-shadow 180ms ease,
            transform 180ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .btn:active:not(:disabled) {
          transform: scale(0.97);
        }

        .btn--md {
          padding: 10px 18px;
          font-size: 0.875rem;
          min-height: 40px;
        }

        .btn--sm {
          padding: 6px 12px;
          font-size: 0.8125rem;
          min-height: 32px;
        }

        /* Accent glass: the same top-lit sheen and rim, over a solid accent,
           plus a coloured pool of light under it so it sits above the page. */
        .btn--primary {
          background-color: var(--accent);
          background-image: var(--glass-sheen);
          color: var(--on-accent);
          border-color: color-mix(in srgb, var(--on-accent) 28%, transparent);
          box-shadow:
            inset 0 1px 0 color-mix(in srgb, var(--on-accent) 45%, transparent),
            0 8px 20px -10px var(--accent);
        }

        .btn--primary:hover:not(:disabled) {
          background-color: color-mix(in srgb, var(--accent) 88%, var(--on-accent));
          box-shadow:
            inset 0 1px 0 color-mix(in srgb, var(--on-accent) 45%, transparent),
            0 10px 26px -10px var(--accent);
        }

        /* .btn sets a transparent border at a higher specificity than
           .glass, so the rim is re-declared here. */
        .btn--secondary {
          color: var(--fg-0);
          border-color: var(--glass-rim);
        }

        .btn--ghost {
          background: transparent;
          color: var(--fg-1);
        }

        .btn--ghost:hover:not(:disabled) {
          color: var(--fg-0);
          background: var(--accent-soft);
        }

        .btn:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }

        .btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        @media (max-width: 767px) {
          .btn--md {
            min-height: 44px;
          }

          .btn--sm {
            min-height: 36px;
          }
        }
      `}</style>
    </button>
  );
}
