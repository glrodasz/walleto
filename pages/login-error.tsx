import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

export default function LoginError() {
  const { query } = useRouter();
  const reason = typeof query.reason === "string" ? query.reason : "";

  return (
    <>
      <Head>
        <title>Sign-in failed · Sublr</title>
      </Head>
      <main className="wrap">
        <section className="panel" role="alert">
          <h1 className="title">Sign-in failed</h1>
          <p className="body">
            We couldn&apos;t complete the sign-in. This usually means the deployment&apos;s URL
            isn&apos;t allowed by Auth0 yet, or a previous attempt expired.
          </p>
          {reason && (
            <p className="reason mono">
              <span className="reason-label">Reason:</span> {reason}
            </p>
          )}
          <div className="actions">
            {/* /api/auth/login is an Auth0 SDK route, not a Next page — must stay <a>. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a className="primary" href="/api/auth/login">
              Try again
            </a>
            <Link className="ghost" href="/">
              Back to home
            </Link>
          </div>
        </section>
      </main>
      <style jsx>{`
        .wrap {
          min-height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 20px;
        }

        .panel {
          max-width: 480px;
          width: 100%;
          padding: 24px 24px 28px;
          border: 1px solid var(--line-strong, #3a3a4d);
          border-radius: var(--r-lg, 16px);
          background: var(--bg-1, #14141b);
          box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.04);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .title {
          margin: 0;
          font-size: 1.4rem;
        }

        .body {
          margin: 0;
          color: var(--fg-1, #b8b8c8);
          font-size: 0.95rem;
          line-height: 1.5;
        }

        .reason {
          margin: 0;
          padding: 10px 12px;
          border-radius: var(--r-sm, 6px);
          border: 1px solid var(--line-strong, #3a3a4d);
          background: var(--bg-2, #1c1c26);
          color: var(--fg-0, #f5f5fa);
          font-size: 0.8rem;
          word-break: break-word;
        }

        .reason-label {
          color: var(--fg-2, #6e6e85);
          margin-right: 6px;
        }

        .actions {
          display: flex;
          gap: 10px;
          margin-top: 4px;
          flex-wrap: wrap;
          justify-content: flex-end;
          align-items: center;
        }

        .primary,
        .ghost {
          display: inline-flex;
          align-items: center;
          padding: 10px 18px;
          border-radius: var(--r-sm, 6px);
          font-weight: 700;
          font-size: 0.9rem;
        }

        .primary {
          background: var(--accent, #7cffb2);
          color: var(--on-accent);
          border: 1px solid var(--accent, #7cffb2);
        }

        .ghost {
          background: transparent;
          color: var(--fg-1, #b8b8c8);
          border: 1px solid var(--line-strong, #3a3a4d);
        }
      `}</style>
    </>
  );
}
