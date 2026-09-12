import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { Close } from "../atoms/Icons";

interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ open, title, onClose, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Lock the page behind the dialog: on a phone the sheet scrolls internally
  // and the page must not scroll along with it.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  // A caller can sit inside a `.glass` card, and `backdrop-filter` makes that
  // card the containing block for its `position: fixed` descendants — so an
  // overlay nested inside one would size and center itself against the card,
  // not the viewport, leaving the rest of the app (the sidebar included)
  // outside the scrim. Portaling onto document.body is the only way out —
  // the same fix already applied to KebabMenu and Combobox.
  return createPortal(
    <div className="overlay" onClick={onClose}>
      <div
        className="glass glass--strong glass--raised panel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="head">
          <h2 className="title">{title}</h2>
          <button
            type="button"
            className="glass glass--tap close"
            onClick={onClose}
            aria-label="Close"
          >
            <Close size={20} />
          </button>
        </header>
        <div className="body">{children}</div>
      </div>

      <style jsx>{`
        /* The scrim is part of the material too: the page behind a sheet is
           pushed out of focus rather than merely dimmed. */
        .overlay {
          position: fixed;
          inset: 0;
          z-index: var(--z-overlay, 200);
          background: var(--scrim);
          backdrop-filter: blur(var(--scrim-blur)) saturate(1.2);
          -webkit-backdrop-filter: blur(var(--scrim-blur)) saturate(1.2);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }

        .panel {
          width: 100%;
          max-width: 560px;
          max-height: calc(100vh - 32px);
          max-height: calc(100dvh - 32px);
          overflow-y: auto;
          overscroll-behavior: contain;
          border-radius: var(--r-xl);
        }

        /* Phones: a bottom sheet. Full width, anchored to the bottom edge,
           padded past the home indicator so the footer buttons stay tappable. */
        @media (max-width: 767px) {
          .overlay {
            align-items: flex-end;
            padding: 0;
          }

          .panel {
            max-width: none;
            max-height: 92vh;
            max-height: 92dvh;
            border-radius: var(--r-2xl) var(--r-2xl) 0 0;
            border-bottom: none;
            padding-bottom: env(safe-area-inset-bottom, 0px);
          }
        }

        .head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 22px 0;
        }

        .title {
          margin: 0;
          font-size: 1rem;
          font-weight: 700;
          color: var(--fg-0);
        }

        .close {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: var(--r-pill);
          color: var(--fg-2);
          cursor: pointer;
        }

        .close:hover {
          color: var(--fg-0);
        }

        .body {
          padding: 18px 22px 22px;
        }
      `}</style>
    </div>,
    document.body
  );
}
