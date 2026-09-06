import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Modal } from "../molecules/Modal";

interface NavItem {
  label: string;
  href: string;
}

/** Grouped so eight destinations read as three ideas instead of one long list. */
const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: "/" }],
  },
  {
    title: "Money",
    items: [
      { label: "Incomes", href: "/incomes" },
      { label: "Expenses", href: "/expenses" },
      { label: "Investments", href: "/investments" },
      { label: "Savings", href: "/savings" },
    ],
  },
  {
    title: "Planning",
    items: [{ label: "Prospect", href: "/prospect" }],
  },
  {
    title: "Account",
    items: [
      { label: "Methods", href: "/methods" },
      { label: "Settings", href: "/settings" },
    ],
  },
];

/** Four direct tabs; everything else sits one tap away behind "More". */
const BOTTOM_NAV: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Incomes", href: "/incomes" },
  { label: "Expenses", href: "/expenses" },
  { label: "Invest", href: "/investments" },
];

const MORE_NAV: NavItem[] = [
  { label: "Savings", href: "/savings" },
  { label: "Prospect", href: "/prospect" },
  { label: "Methods", href: "/methods" },
  { label: "Settings", href: "/settings" },
];

function NavIcon({ href, size = 20 }: { href: string; size?: number }) {
  const p = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (href === "/")
    return (
      <svg {...p}>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    );
  if (href === "/incomes")
    return (
      <svg {...p}>
        <line x1="12" y1="19" x2="12" y2="5" />
        <polyline points="5 12 12 5 19 12" />
      </svg>
    );
  if (href === "/expenses")
    return (
      <svg {...p}>
        <line x1="12" y1="5" x2="12" y2="19" />
        <polyline points="19 12 12 19 5 12" />
      </svg>
    );
  if (href === "/investments")
    return (
      <svg {...p}>
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    );
  if (href === "/savings")
    return (
      <svg {...p}>
        <circle cx="12" cy="13" r="7" />
        <path d="M12 6V4" />
        <path d="M9 17v1a3 3 0 0 0 6 0v-1" />
        <path d="M19 13c0-1.1-.4-2.1-1-3" />
      </svg>
    );
  if (href === "/prospect")
    return (
      <svg {...p}>
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
      </svg>
    );
  if (href === "/methods")
    return (
      <svg {...p}>
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    );
  if (href === "#more")
    return (
      <svg {...p}>
        <circle cx="5" cy="12" r="1.5" />
        <circle cx="12" cy="12" r="1.5" />
        <circle cx="19" cy="12" r="1.5" />
      </svg>
    );
  return (
    <svg {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export function Sidebar() {
  const { pathname } = useRouter();
  const { user } = useUser();
  const [moreOpen, setMoreOpen] = useState(false);

  const name = user?.name ?? user?.nickname ?? "Account";
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const moreActive = MORE_NAV.some((item) => item.href === pathname);

  return (
    <>
      {/* ── Desktop sidebar ──────────────────────────── */}
      <aside className="waletto-sidebar">
        <div className="logo">Waletto</div>

        <nav className="nav" aria-label="Main navigation">
          {NAV_SECTIONS.map((section) => (
            <div className="section" key={section.title}>
              <span className="section-title">{section.title}</span>
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={pathname === item.href ? "page" : undefined}
                  className={`nav-item${pathname === item.href ? " is-active" : ""}`}
                >
                  <NavIcon href={item.href} size={18} />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="account">
          <div className="who">
            <span className="avatar" aria-hidden="true">
              {initial}
            </span>
            <span className="who-text">
              <span className="who-name">{name}</span>
              {user?.email && <span className="who-mail">{user.email}</span>}
            </span>
          </div>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/api/auth/logout" className="logout">
            Log out
          </a>
        </div>
      </aside>

      {/* ── Mobile bottom nav ────────────────────────── */}
      <nav className="waletto-bnav" aria-label="Mobile navigation">
        {BOTTOM_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={pathname === item.href ? "page" : undefined}
            className={`bnav-item${pathname === item.href ? " is-active" : ""}`}
          >
            <NavIcon href={item.href} size={22} />
            <span>{item.label}</span>
          </Link>
        ))}
        <button
          type="button"
          className={`bnav-item bnav-more${moreActive ? " is-active" : ""}`}
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen(true)}
        >
          <NavIcon href="#more" size={22} />
          <span>More</span>
        </button>
      </nav>

      <Modal open={moreOpen} title="More" onClose={() => setMoreOpen(false)}>
        <div className="more">
          {MORE_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              className={`more-item${pathname === item.href ? " is-active" : ""}`}
              onClick={() => setMoreOpen(false)}
            >
              <NavIcon href={item.href} size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
          <div className="more-account">
            <span className="avatar" aria-hidden="true">
              {initial}
            </span>
            <span className="who-text">
              <span className="who-name">{name}</span>
              {user?.email && <span className="who-mail">{user.email}</span>}
            </span>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/api/auth/logout" className="logout">
              Log out
            </a>
          </div>
        </div>
      </Modal>

      {/*
       * styled-jsx does not add its scoping hash to a className handed to a
       * child component, so rules targeting `Link` must go through :global()
       * from a scoped parent — otherwise they compile to dead CSS. That is
       * exactly what silently unstyled this whole sidebar before.
       */}
      <style jsx>{`
        .waletto-sidebar {
          width: 232px;
          flex-shrink: 0;
          background: var(--bg-1);
          border-right: 1px solid var(--line);
          display: flex;
          flex-direction: column;
          gap: 28px;
          padding: 24px 12px 16px;
          height: 100vh;
          position: sticky;
          top: 0;
          overflow-y: auto;
        }

        .logo {
          font-family: var(--font-display, "Space Grotesk", system-ui, sans-serif);
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--fg-0);
          padding: 0 10px;
          letter-spacing: -0.03em;
        }

        .nav {
          display: flex;
          flex-direction: column;
          gap: 22px;
          flex: 1;
        }

        .section {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .section-title {
          padding: 0 10px 6px;
          font-size: 0.66rem;
          font-weight: 700;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          color: var(--fg-2);
          opacity: 0.75;
        }

        .nav :global(.nav-item) {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 10px;
          border-radius: var(--r-sm);
          border-left: 2px solid transparent;
          font-size: 0.875rem;
          font-weight: 500;
          line-height: 1;
          color: var(--fg-2);
          text-decoration: none;
          transition:
            background 0.15s,
            color 0.15s;
        }

        .nav :global(.nav-item:hover) {
          background: var(--bg-2);
          color: var(--fg-0);
        }

        .nav :global(.nav-item:focus-visible) {
          outline: 2px solid var(--accent);
          outline-offset: -2px;
        }

        .nav :global(.nav-item.is-active) {
          background: var(--bg-2);
          color: var(--accent);
          border-left-color: var(--accent);
          font-weight: 600;
        }

        .account {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 14px 10px 0;
          border-top: 1px solid var(--line);
        }

        .who {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .avatar {
          flex-shrink: 0;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: var(--bg-3);
          color: var(--fg-1);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          font-weight: 700;
        }

        .who-text {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .who-name {
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--fg-0);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .who-mail {
          font-size: 0.7rem;
          color: var(--fg-2);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .logout {
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--fg-2);
          text-decoration: none;
          padding: 2px 0;
        }

        .logout:hover {
          color: var(--accent-hot);
        }

        .waletto-bnav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 64px;
          display: none;
          align-items: stretch;
          background: var(--bg-1);
          border-top: 1px solid var(--line);
          z-index: var(--z-nav, 100);
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }

        .waletto-bnav :global(.bnav-item) {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 8px 4px 4px;
          color: var(--fg-2);
          text-decoration: none;
          font-size: 0.6rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          line-height: 1;
          -webkit-tap-highlight-color: transparent;
        }

        .waletto-bnav :global(.bnav-item.is-active) {
          color: var(--accent);
        }

        .bnav-more {
          border: none;
          background: transparent;
          font-family: inherit;
          cursor: pointer;
        }

        .more {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .more :global(.more-item) {
          display: flex;
          align-items: center;
          gap: 12px;
          min-height: 48px;
          padding: 0 10px;
          border-radius: var(--r-sm);
          font-size: 0.95rem;
          font-weight: 500;
          color: var(--fg-1);
          text-decoration: none;
        }

        .more :global(.more-item.is-active) {
          color: var(--accent);
          background: var(--bg-2);
        }

        .more-account {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 10px;
          padding: 14px 10px 0;
          border-top: 1px solid var(--line);
        }

        .more-account .who-text {
          flex: 1;
        }

        .more-account .logout {
          flex-shrink: 0;
          padding: 10px 12px;
          border: 1px solid var(--line);
          border-radius: var(--r-sm);
        }

        @media (max-width: 767px) {
          .waletto-sidebar {
            display: none;
          }

          .waletto-bnav {
            display: flex;
          }
        }
      `}</style>
    </>
  );
}
