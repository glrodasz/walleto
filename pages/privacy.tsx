import Head from "next/head";
import Link from "next/link";
import { ChevronLeft, Shield } from "../components/atoms/Icons";
import { Card } from "../components/atoms/Card";

const LAST_UPDATED = "September 26, 2026";

export default function Privacy() {
  const support = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@waletto.example";

  return (
    <>
      <Head>
        <title>Privacy Policy · Waletto</title>
      </Head>
      <main className="wrap">
        <div className="page">
          <Link className="back" href="/">
            <ChevronLeft size={16} /> Back to Waletto
          </Link>
          <Card>
            <header className="head">
              <Shield size={22} />
              <div>
                <h1 className="title">Privacy Policy</h1>
                <p className="updated">Last updated: {LAST_UPDATED}</p>
              </div>
            </header>

            <section className="section">
              <h2>Overview</h2>
              <p>
                Waletto is a personal finance planner. This policy explains what information we
                collect, how we use it, and the choices you have. By using Waletto, you agree to the
                collection and use of information as described here.
              </p>
            </section>

            <section className="section">
              <h2>Information we collect</h2>
              <p>We collect only what the app needs to work:</p>
              <ul>
                <li>
                  <strong>Account information</strong> — your name and email address, provided by
                  our authentication provider when you sign in.
                </li>
                <li>
                  <strong>Financial data you enter</strong> — recurring items, transactions,
                  categories, tags, payment methods, accounts, and balances you add to your plan. We
                  never connect to your bank; every figure is one you typed in yourself.
                </li>
                <li>
                  <strong>Preferences</strong> — currency, date format, theme, and similar display
                  settings.
                </li>
              </ul>
            </section>

            <section className="section">
              <h2>How we use your information</h2>
              <p>
                We use your information solely to operate Waletto: to show your plan, activity and
                net worth, to convert amounts between currencies, and to keep your preferences
                across sessions. We do not sell your data, and we do not use it for advertising.
              </p>
            </section>

            <section className="section">
              <h2>Data storage &amp; security</h2>
              <p>
                Your data is stored in Google Cloud Firestore and transmitted over encrypted
                connections. Authentication is handled by Auth0; Waletto never sees or stores your
                password. Signing out clears any financial data cached on that device.
              </p>
            </section>

            <section className="section">
              <h2>Third-party services</h2>
              <p>
                We rely on a small number of providers to run the app: Auth0 for sign-in, Google
                Cloud Firestore for storage, and a currency exchange-rate provider to convert
                amounts between currencies. These providers process data only as needed to deliver
                their service to us.
              </p>
            </section>

            <section className="section">
              <h2>Data retention &amp; deletion</h2>
              <p>
                We keep your data for as long as your account is active. You can request an export
                or full deletion of your account and its data at any time by writing to{" "}
                <a href={`mailto:${support}?subject=Delete%20my%20Waletto%20account`}>{support}</a>.
                Deletion removes your financial records permanently and cannot be undone.
              </p>
            </section>

            <section className="section">
              <h2>Your rights</h2>
              <p>
                Depending on where you live, you may have the right to access, correct, export, or
                delete your personal information. Contact us using the email above to exercise any
                of these rights.
              </p>
            </section>

            <section className="section">
              <h2>Children&apos;s privacy</h2>
              <p>
                Waletto is not directed at children under 16, and we do not knowingly collect
                information from them.
              </p>
            </section>

            <section className="section">
              <h2>Changes to this policy</h2>
              <p>
                We may update this policy from time to time. Material changes will be reflected by
                updating the date at the top of this page.
              </p>
            </section>

            <section className="section">
              <h2>Contact us</h2>
              <p>
                Questions about this policy or your data? Write to us at{" "}
                <a href={`mailto:${support}`}>{support}</a>.
              </p>
            </section>
          </Card>
        </div>
      </main>
      <style jsx>{`
        .wrap {
          min-height: 100%;
          display: flex;
          justify-content: center;
          padding: 32px 20px 48px;
        }

        .page {
          max-width: 720px;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .back {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          align-self: flex-start;
          color: var(--fg-1);
          font-size: 0.85rem;
          font-weight: 600;
        }

        .head {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .title {
          margin: 0;
          font-size: 1.4rem;
        }

        .updated {
          margin: 2px 0 0;
          color: var(--fg-2);
          font-size: 0.8rem;
        }

        .section {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .section h2 {
          margin: 0;
          font-size: 1rem;
        }

        .section p,
        .section li {
          margin: 0;
          color: var(--fg-1);
          font-size: 0.9rem;
          line-height: 1.55;
        }

        .section ul {
          margin: 0;
          padding-left: 20px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .section a {
          color: var(--accent);
        }
      `}</style>
    </>
  );
}
