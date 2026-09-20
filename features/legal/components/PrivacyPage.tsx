import Head from "next/head";
import Link from "next/link";

/** Bump when the policy's substance changes; the date is shown on the page. */
export const PRIVACY_POLICY_UPDATED = "2026-09-20";

/**
 * The privacy notice, public and readable without a session. The facts here
 * mirror docs/compliance.md: if a processor, a field or a flow changes, both
 * change. Deployment-specific details (contact, data region) come from env.
 */
export function PrivacyPage() {
  const support = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
  const region = process.env.NEXT_PUBLIC_DATA_REGION;

  return (
    <>
      <Head>
        <title>Privacy policy · Waletto</title>
        <meta
          name="description"
          content="What Waletto collects, where it is stored, and your rights."
        />
      </Head>
      <main className="wrap">
        <article className="glass panel">
          <header className="head">
            <p className="kicker">Waletto</p>
            <h1 className="title">Privacy policy</h1>
            <p className="meta">Last updated {PRIVACY_POLICY_UPDATED}</p>
          </header>

          <section>
            <h2>The short version</h2>
            <ul>
              <li>
                Waletto is a personal-finance tracker. It records what you type; it never connects
                to your bank and never moves money.
              </li>
              <li>
                Your financial records are stored in Google Cloud Firestore and are readable only by
                you. Sign-in is handled by Auth0; Waletto never sees or stores your password.
              </li>
              <li>
                No analytics, advertising or tracking scripts run in the app. The only cookie is the
                one that keeps you signed in.
              </li>
              <li>
                You can download everything or erase your account yourself, at any time, from
                Settings › Data &amp; privacy.
              </li>
            </ul>
          </section>

          <section>
            <h2>Who is responsible</h2>
            <p>
              The person operating this Waletto deployment is the data controller (in the terms of
              the EU General Data Protection Regulation and Colombia&apos;s Ley 1581 de 2012, the{" "}
              <em>responsable del tratamiento</em>).
              {support ? (
                <>
                  {" "}
                  You can reach them at <a href={`mailto:${support}`}>{support}</a>.
                </>
              ) : (
                " Contact details are shown in Settings › About."
              )}
            </p>
          </section>

          <section>
            <h2>What is collected</h2>
            <h3>Identity, through Auth0</h3>
            <p>
              When you sign in, Auth0 (Okta, Inc.) gives Waletto your name, email address, a profile
              picture URL if your sign-in provider offers one, and a stable identifier. Waletto
              keeps the identifier as the key to your data; your name and email are read from the
              session and are not copied into the database. Passwords and second factors are managed
              entirely by Auth0.
            </p>
            <h3>The financial records you enter</h3>
            <p>
              Everything below is data you type in, kept exactly as entered and tied to your
              identifier:
            </p>
            <ul>
              <li>Categories and tags you create.</li>
              <li>
                Payment methods: a nickname, the type (card, bank transfer, wallet, cash…), the
                network or provider, the currencies it charges in and, optionally, the last four
                digits. Full card numbers, expiry dates or security codes are never asked for or
                stored.
              </li>
              <li>
                Accounts and pockets for investments and savings: a name, the bank or broker, the
                currency and an interest rate if you enter one.
              </li>
              <li>
                Recurring items: what repeats, how much, in which currency, how often, and optional
                notes.
              </li>
              <li>
                Transactions: dated amounts with their currency, category, optional payment method,
                tags and notes, plus what a card actually charged when it differs.
              </li>
              <li>Value checks: what an account was worth on a date, and its cost basis.</li>
              <li>
                Preferences: main and display currency, date format, start of week, theme, language,
                and whether to show a Gravatar picture.
              </li>
            </ul>
            <h3>Technical data</h3>
            <p>
              Vercel, which hosts the app, records standard request logs (IP address, user agent,
              URL, timestamp) for a short period to run and protect the service. Waletto&apos;s own
              server logs record errors without personal or financial content.
            </p>
          </section>

          <section>
            <h2>What is not collected</h2>
            <ul>
              <li>
                No bank, broker or card-network connections. Waletto cannot see your real accounts.
              </li>
              <li>
                No analytics, advertising identifiers, session recordings or third-party trackers.
              </li>
              <li>No location, contacts, camera or microphone access.</li>
            </ul>
          </section>

          <section>
            <h2>Why, and on what basis</h2>
            <ul>
              <li>
                <strong>To run the service you asked for</strong> — storing and showing your
                records, converting currencies for display, keeping you signed in. Legal basis:
                performance of a contract (GDPR art. 6(1)(b)); in Colombia, your authorization given
                when you create the account.
              </li>
              <li>
                <strong>The Gravatar picture</strong> — only if you turn it on in Settings ›
                Preferences. Your browser then asks gravatar.com (Automattic, Inc.) for a picture
                using a hash of your email, which also reveals your IP address to them. Legal basis:
                consent, withdrawable by turning it off.
              </li>
              <li>
                <strong>Security and legal duties</strong> — keeping request logs, answering lawful
                requests. Legal basis: legitimate interest and legal obligation.
              </li>
            </ul>
            <p>Waletto does not profile you, sell data, or use your records for advertising.</p>
          </section>

          <section>
            <h2>Where it is stored and who processes it</h2>
            <table>
              <thead>
                <tr>
                  <th>Processor</th>
                  <th>What they handle</th>
                  <th>Where</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Google Cloud (Firestore, Firebase Authentication)</td>
                  <td>All records listed above, encrypted at rest and in transit</td>
                  <td>{region ?? "The Google Cloud region configured for this deployment"}</td>
                </tr>
                <tr>
                  <td>Auth0 by Okta</td>
                  <td>Sign-in identity, password, second factor</td>
                  <td>The Auth0 tenant region configured for this deployment</td>
                </tr>
                <tr>
                  <td>Vercel</td>
                  <td>Serving the app, request logs</td>
                  <td>Vercel&apos;s edge network and serverless regions</td>
                </tr>
                <tr>
                  <td>apilayer (exchange rates)</td>
                  <td>Nothing personal: the server fetches a currency table</td>
                  <td>—</td>
                </tr>
                <tr>
                  <td>Gravatar (Automattic)</td>
                  <td>A hash of your email and your IP, only when you opt in</td>
                  <td>United States</td>
                </tr>
              </tbody>
            </table>
            <p>
              Each processor acts under a data-processing agreement. Where data leaves the European
              Economic Area, the transfer relies on the European Commission&apos;s Standard
              Contractual Clauses or an adequacy decision. If you are in Colombia, creating an
              account is your express authorization for your data to be processed on these
              providers&apos; infrastructure outside Colombia.
            </p>
          </section>

          <section>
            <h2>How long it is kept</h2>
            <p>
              Your records stay until you delete them or your account. Deleting the account erases
              every record from the database immediately; provider backups age out within their
              retention windows (typically up to 30 days). Vercel request logs are kept for a short,
              provider-defined period.
            </p>
          </section>

          <section>
            <h2>Your rights</h2>
            <ul>
              <li>
                <strong>Access and portability</strong> — Settings › Data &amp; privacy › Data
                export downloads everything as a JSON file.
              </li>
              <li>
                <strong>Rectification</strong> — every record can be edited in the app; your name
                and email are changed through your sign-in provider.
              </li>
              <li>
                <strong>Erasure</strong> — Settings › Data &amp; privacy › Delete account erases
                everything and signs you out. If your sign-in identity at Auth0 cannot be removed
                automatically in this deployment, write to the contact above and it is removed by
                hand.
              </li>
              <li>
                <strong>Objection, restriction and withdrawing consent</strong> — write to the
                contact above; the Gravatar consent is withdrawn by turning it off.
              </li>
              <li>
                <strong>Complaint</strong> — in the EU, to your national supervisory authority (in
                Sweden, Integritetsskyddsmyndigheten, IMY); in Colombia, to the Superintendencia de
                Industria y Comercio (SIC).
              </li>
            </ul>
            <p>
              Residents of Colombia may also file a <em>consulta</em> (answered within ten business
              days) or a <em>reclamo</em> (answered within fifteen business days), as Ley 1581
              provides, at the contact above.
            </p>
          </section>

          <section>
            <h2>Cookies and local storage</h2>
            <p>
              One cookie, set by Auth0, keeps your session. It is strictly necessary and is removed
              when you log out. Your browser&apos;s local storage holds display preferences (theme,
              the privacy mask, chart periods, dismissed tips) and a one-day cache of exchange
              rates; it never holds your records.
            </p>
          </section>

          <section>
            <h2>Security</h2>
            <p>
              Data travels over TLS and is encrypted at rest by Google Cloud. Database rules allow
              each record to be read only by the account that owns it, and every write goes through
              the server, which checks that what you reference is yours. Waletto stores no
              passwords. If a breach affecting your data ever occurred, you would be informed
              without undue delay, as the law requires.
            </p>
          </section>

          <section>
            <h2>Children</h2>
            <p>
              Waletto is not directed at children under 16 and does not knowingly hold their data.
            </p>
          </section>

          <section>
            <h2>Changes</h2>
            <p>
              When this policy changes in substance, the date above moves and the change is
              described in the project&apos;s release notes.
            </p>
          </section>

          <footer className="foot">
            <Link href="/">Back to Waletto</Link>
          </footer>
        </article>
      </main>

      <style jsx>{`
        .wrap {
          min-height: 100%;
          display: flex;
          justify-content: center;
          padding: 32px 16px 48px;
        }

        .panel {
          width: 100%;
          max-width: 760px;
          padding: 28px 28px 32px;
          border-radius: var(--r-xl);
          display: flex;
          flex-direction: column;
          gap: 22px;
          color: var(--fg-0);
          line-height: 1.55;
        }

        .head {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .kicker {
          margin: 0;
          font-size: 0.75rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--fg-2);
        }

        .title {
          margin: 0;
          font-size: 1.6rem;
        }

        .meta {
          margin: 0;
          font-size: 0.85rem;
          color: var(--fg-2);
        }

        section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        h2 {
          margin: 0;
          font-size: 1.05rem;
        }

        h3 {
          margin: 6px 0 0;
          font-size: 0.9rem;
          color: var(--fg-1);
        }

        p,
        li {
          margin: 0;
          font-size: 0.92rem;
          color: var(--fg-1);
        }

        ul {
          margin: 0;
          padding-left: 20px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        strong {
          color: var(--fg-0);
        }

        a {
          color: var(--accent);
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }

        th,
        td {
          text-align: left;
          vertical-align: top;
          padding: 8px 8px 8px 0;
          border-bottom: 1px solid var(--line);
          color: var(--fg-1);
        }

        th {
          color: var(--fg-0);
          font-weight: 600;
        }

        .foot {
          font-size: 0.9rem;
        }

        @media (max-width: 480px) {
          .panel {
            padding: 22px 16px 26px;
          }
        }
      `}</style>
    </>
  );
}
