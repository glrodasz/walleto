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
  return (
    <button
      type={type}
      className={`btn btn--${variant} btn--${size}${className ? ` ${className}` : ""}`}
      {...rest}
    >
      {children}

      <style jsx>{`
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: var(--r-md);
          border: 1px solid transparent;
          font-family: inherit;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition:
            opacity 120ms ease,
            background 120ms ease,
            border-color 120ms ease;
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

        .btn--primary {
          background: var(--accent);
          color: var(--on-accent);
        }

        .btn--secondary {
          background: var(--bg-2);
          color: var(--fg-0);
          border-color: var(--line);
        }

        .btn--secondary:hover:not(:disabled) {
          background: var(--bg-3);
          border-color: var(--line-strong);
        }

        .btn--ghost {
          background: transparent;
          color: var(--fg-1);
        }

        .btn--ghost:hover:not(:disabled) {
          color: var(--fg-0);
        }

        .btn:hover:not(:disabled) {
          opacity: 0.92;
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
