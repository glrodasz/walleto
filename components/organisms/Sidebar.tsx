import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useUser } from "@auth0/nextjs-auth0/client";
import type { ComponentType } from "react";
import { Modal } from "../molecules/Modal";
import { BuildBadge } from "../atoms/BuildBadge";
import {
  ArrowDown,
  ArrowUp,
  Circle,
  Compass,
  Home,
  MoreHorizontal,
  Settings,
  TrendingUp,
  Waves,
} from "../atoms/Icons";
import type { IconProps } from "../atoms/Icons";

interface NavItem {
  label: string;
  href: string;
  icon: ComponentType<IconProps>;
}

const DASHBOARD: NavItem = { label: "Dashboard", href: "/", icon: Home };

/** Grouped so seven destinations read as three ideas instead of one long list. */
const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "Money",
    items: [
      { label: "Incomes", href: "/incomes", icon: ArrowUp },
      { label: "Expenses", href: "/expenses", icon: ArrowDown },
      { label: "Investments", href: "/investments", icon: TrendingUp },
      { label: "Savings", href: "/savings", icon: Circle },
    ],
  },
  {
    title: "Planning",
    items: [{ label: "Prospect", href: "/prospect", icon: Compass }],
  },
  {
    title: "Account",
    items: [{ label: "Settings", href: "/settings", icon: Settings }],
  },
];

/** Four direct tabs; everything else sits one tap away behind "More". */
const BOTTOM_NAV: NavItem[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Incomes", href: "/incomes", icon: ArrowUp },
  { label: "Expenses", href: "/expenses", icon: ArrowDown },
  { label: "Invest", href: "/investments", icon: TrendingUp },
];

const MORE_NAV: NavItem[] = [
  { label: "Savings", href: "/savings", icon: Circle },
  { label: "Prospect", href: "/prospect", icon: Compass },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const { pathname } = useRouter();
  const { user } = useUser();
  const [moreOpen, setMoreOpen] = useState(false);

  const name = user?.name ?? user?.nickname ?? "Account";
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const moreActive = MORE_NAV.some((item) => item.href === pathname);

  const navLink = (item: NavItem, size: number) => {
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={pathname === item.href ? "page" : undefined}
        className={`nav-item${pathname === item.href ? " is-active" : ""}`}
      >
        <Icon size={size} />
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <>
      {/* ── Desktop sidebar ──────────────────────────── */}
      <aside className="glass glass--strong waletto-sidebar">
        <div className="logo">
          <span className="logo-mark" aria-hidden="true">
            <Waves size={22} />
          </span>
          Waletto
          <BuildBadge />
        </div>

        <nav className="nav" aria-label="Main navigation">
          <div className="section">{navLink(DASHBOARD, 18)}</div>
          {NAV_SECTIONS.map((section) => (
            <div className="section" key={section.title}>
              <span className="section-title">{section.title}</span>
              {section.items.map((item) => navLink(item, 18))}
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
      <nav
        className="glass glass--strong glass--raised waletto-bnav"
        aria-label="Mobile navigation"
      >
        {BOTTOM_NAV.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              className={`bnav-item${pathname === item.href ? " is-active" : ""}`}
            >
              <Icon size={22} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          className={`bnav-item bnav-more${moreActive ? " is-active" : ""}`}
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen(true)}
        >
          <MoreHorizontal size={22} />
          <span>More</span>
        </button>
      </nav>

      <Modal open={moreOpen} title="More" onClose={() => setMoreOpen(false)}>
        <div className="more">
          {MORE_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
                className={`more-item${pathname === item.href ? " is-active" : ""}`}
                onClick={() => setMoreOpen(false)}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <div className="more-build">
            <BuildBadge />
          </div>
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
        /* A single tall pane of glass. Only the inner edge is drawn: the other
           three sit against the viewport, where a rim would read as a seam. */
        .waletto-sidebar {
          width: 236px;
          flex-shrink: 0;
          border-width: 0 1px 0 0;
          border-radius: 0;
          box-shadow:
            inset -1px 0 0 var(--glass-edge-low),
            var(--glass-shadow);
          display: flex;
          flex-direction: column;
          gap: 28px;
          padding: 24px 14px 16px;
          height: 100vh;
          position: sticky;
          top: 0;
          overflow-y: auto;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--fg-0);
          padding: 0 10px;
          letter-spacing: -0.03em;
        }

        .logo-mark {
          display: inline-flex;
          color: var(--accent);
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
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.02em;
          color: var(--fg-2);
        }

        .nav :global(.nav-item) {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: var(--r-md);
          font-size: 0.9rem;
          font-weight: 500;
          line-height: 1;
          color: var(--fg-1);
          text-decoration: none;
          transition:
            background 0.15s,
            color 0.15s;
        }

        .nav :global(.nav-item:hover) {
          background: var(--glass-hover);
          color: var(--fg-0);
        }

        .nav :global(.nav-item:focus-visible) {
          outline: 2px solid var(--accent);
          outline-offset: -2px;
        }

        .nav :global(.nav-item.is-active) {
          background-color: var(--accent-soft);
          background-image: var(--glass-sheen);
          color: var(--accent);
          font-weight: 600;
          box-shadow:
            inset 0 0 0 1px color-mix(in srgb, var(--accent) 22%, transparent),
            inset 0 1px 0 var(--glass-edge);
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
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--accent);
          color: var(--on-accent);
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
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--fg-1);
          text-decoration: none;
          padding: 2px 0;
        }

        .logout:hover {
          color: var(--accent-hot);
        }

        /* A floating capsule rather than a bar welded to the screen edge:
           content slides under it and is visibly refracted through it, which
           is the whole point of the material. PageLayout already reserves the
           room for it at the bottom of every page. */
        .waletto-bnav {
          position: fixed;
          bottom: calc(10px + env(safe-area-inset-bottom, 0px));
          left: 12px;
          right: 12px;
          height: 62px;
          display: none;
          align-items: stretch;
          border-radius: var(--r-2xl);
          z-index: var(--z-nav, 100);
          overflow: hidden;
        }

        .waletto-bnav :global(.bnav-item) {
          position: relative;
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

        /* The lit lozenge behind the current tab. */
        .waletto-bnav :global(.bnav-item.is-active)::before {
          content: "";
          position: absolute;
          inset: 6px 6px;
          border-radius: var(--r-lg);
          background-color: var(--accent-soft);
          background-image: var(--glass-sheen);
          box-shadow: inset 0 1px 0 var(--glass-edge);
        }

        .waletto-bnav :global(.bnav-item) > :global(*) {
          position: relative;
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
          border-radius: var(--r-md);
          font-size: 0.95rem;
          font-weight: 500;
          color: var(--fg-1);
          text-decoration: none;
        }

        .more :global(.more-item.is-active) {
          color: var(--accent);
          background-color: var(--accent-soft);
          background-image: var(--glass-sheen);
          box-shadow: inset 0 1px 0 var(--glass-edge);
        }

        .more-build {
          display: flex;
          justify-content: center;
          padding-top: 14px;
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
