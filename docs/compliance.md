# Waletto — data protection and compliance

What Waletto holds, which rules apply to it, how the app meets them today, and
what is still open. Written for the person running a deployment; the facts
here are checked against the code and should move with it. The user-facing
version is the privacy policy at `/privacy`
(`features/legal/components/PrivacyPage.tsx`).

Last reviewed: 2026-09-20 · Markets in scope: EU/EEA (Sweden), Colombia,
United States.

---

## 1. Scope: what applies and what does not

Waletto is a **personal-finance tracker**. It records what the user types. It
does not connect to banks, hold funds, move money, or process card payments.
That single fact decides most of the scoping.

| Regime                                                        | Applies?  | Why                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **GDPR** (EU/EEA users)                                       | **Yes**   | A person's ledger, salary, loan payments and portfolio balances are personal data. Financial data is not a GDPR "special category", but it is sensitive in practice and regulators treat it as high-risk.                                                                                                       |
| **Colombia — Ley 1581/2012, Decreto 1377/2013** (habeas data) | **Yes**   | Same reasoning: personal data of Colombian residents. Requires prior authorization, a published treatment policy, the rights of consulta / reclamo / supresión, and a lawful basis for cross-border transfer. RNBD registration applies only above asset thresholds a personal project does not meet.           |
| **Colombia — Ley 1266/2008** (financial habeas data)          | No        | Governs credit-bureau reporting and credit histories exchanged between operators. Waletto is not a data operator and reports to nobody.                                                                                                                                                                         |
| **United States — federal**                                   | No        | No general federal privacy statute. **GLBA** covers "financial institutions" offering financial products; a self-service tracker that never touches an account is not one. The **FTC Act §5** still forbids deceptive privacy or security claims, which is why in-app copy must match reality (see §5, item 5). |
| **United States — state laws** (CCPA/CPRA, CO, VA, CT…)       | Not now   | All have thresholds (revenue, 100k+ consumers, or selling data). Re-assess if the user base grows or the app is monetised.                                                                                                                                                                                      |
| **PSD2 / PSD3, e-money, open banking licensing**              | No        | No payment initiation, no account information service, no funds. Would change the day a bank aggregator (Plaid, Belvo, TrueLayer, Tink) is added — `AGENTS.md` §7 lists bank integrations as deferred; treat that as a compliance gate, not just a feature.                                                     |
| **AML / KYC**                                                 | No        | No funds, no counterparties.                                                                                                                                                                                                                                                                                    |
| **PCI DSS**                                                   | No        | No primary account number is ever stored. `paymentMethods.last4` is validated to exactly four digits (`schemas/index.ts`, `PaymentMethodInputSchema`). Last-4 alone is out of PCI scope. Keep it that way: never add a field that can hold a PAN, expiry or CVV.                                                |
| **ePrivacy / cookie consent**                                 | No banner | The only cookie is Auth0's session cookie, which is strictly necessary. No analytics, no ads, no third-party scripts. If any of those are ever added, a consent banner becomes required.                                                                                                                        |

**Conclusion.** The obligations are those of a small data controller under
GDPR and Ley 1581: tell people what happens to their data, give them a way to
get it and erase it, keep it secure, contract properly with processors, and
know what to do in a breach. That is what the rest of this document covers.

---

## 2. Data inventory (record of processing)

Single store: **Cloud Firestore** in the Firebase project named in
`.firebaserc` (`sublr-dev` by default — see §6 about a production project).
Encrypted at rest and in transit by Google; no customer-managed keys, no
field-level encryption in the app.

Every per-user document carries `userId` = the Auth0 `sub`. The list below is
`USER_COLLECTIONS` in `helpers/userData.ts`; a new per-user collection must be
added there or it is neither exported nor erased.

| Collection              | Fields with personal or financial meaning                                                                                            | Sensitivity | Purpose                | Retention              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ----------- | ---------------------- | ---------------------- |
| `users/{sub}`           | currencies, onboarding state, theme, date format, week start, language, `showGravatar`. **No name, no email** — those stay in Auth0. | Low         | Preferences            | Until account deletion |
| `categories`            | user-authored names (≤40)                                                                                                            | Low         | Classification         | Until account deletion |
| `tags`                  | user-authored labels (≤30)                                                                                                           | Low         | Classification         | Until account deletion |
| `paymentMethods`        | nickname, type, network/provider (free text ≤40), `last4` (4 digits), currencies                                                     | Medium      | Attribute payments     | Until account deletion |
| `accounts`              | name, bank/broker (free text ≤60), currency, interest rate                                                                           | Medium      | Where money sits       | Until account deletion |
| `recurrentTransactions` | name, amount, currency, cadence, `type` (SALARY, LOAN_PAYMENT…), notes (≤500), tags                                                  | **High**    | The plan               | Until account deletion |
| `transactions`          | name (≤100), amount, currency, charged pair, date, status, notes (≤500), tags, method, account                                       | **High**    | The ledger             | Until account deletion |
| `investmentValuations`  | value, cost basis, gain %, date, note (≤200)                                                                                         | **High**    | Net-worth snapshots    | Until account deletion |
| `services` (global)     | none — subscription catalogue with per-country prices                                                                                | —           | Onboarding suggestions | Indefinite             |
| `rates/{YYYY-MM-DD}`    | none — exchange rates                                                                                                                | —           | FX fallback cache      | Grows daily; see §7    |

Free-text fields (`name`, `note`, `provider`, `network`) can contain anything
the user types, including things they should not (a full card number, another
person's name). The app does not scan for that; the privacy policy tells users
not to.

Identity data (name, email, picture URL, provider id, password hash, MFA
factors) lives **only in Auth0**. The app reads name and email from the
session at render time and never writes them to Firestore.

Browser storage: `localStorage` holds theme, the privacy mask, chart period,
dismissed tips, and a 24 h exchange-rate cache; the Firebase SDK keeps its ID
token in IndexedDB. No records are cached client-side.

Server logs: `console.error` only, with no request bodies, amounts or emails.
Exception to fix (§7): the Auth0 callback error text is reflected into
`/login-error?reason=…` and therefore into Vercel access logs.

---

## 3. Data flows and sub-processors

```
browser ──TLS──▶ Vercel (Next.js pages + API routes) ──▶ Google Cloud Firestore
   │                      │
   │                      └──▶ Auth0 (session, identity)          [server-side]
   │                      └──▶ apilayer exchangerates_data          [no personal data]
   ├──TLS──▶ Firestore (read-only onSnapshot, custom token minted by /api/firebase)
   └──TLS──▶ gravatar.com                                           [only if showGravatar = true]
```

| Sub-processor           | Data                                              | Role                   | Contract to accept                                                    | Transfer mechanism                           |
| ----------------------- | ------------------------------------------------- | ---------------------- | --------------------------------------------------------------------- | -------------------------------------------- |
| Google Cloud / Firebase | all records; Firebase Auth uid                    | Processor              | Google Cloud Data Processing Addendum (accepted in the Cloud console) | SCCs built into the DPA; choose an EU region |
| Auth0 (Okta, Inc.)      | name, email, password, MFA, login IPs             | Processor              | Okta/Auth0 Data Processing Addendum                                   | SCCs; pick an EU tenant region if possible   |
| Vercel, Inc.            | request logs (IP, UA, URL), function execution    | Processor              | Vercel DPA (Dashboard → Settings → Legal)                             | SCCs                                         |
| apilayer (Ideracloud)   | none                                              | —                      | —                                                                     | —                                            |
| Automattic (Gravatar)   | SHA-256 of email + IP + referrer, **opt-in only** | Independent controller | Disclosed in the policy; consent via Settings › Preferences           | User consent                                 |

Colombia: transfers to countries without an adequate level of protection need
the holder's express authorization (Ley 1581 art. 26). The privacy policy
states that creating an account is that authorization; the signup flow should
surface it explicitly (§7, item 9).

---

## 4. Controls in place (verified in code)

- **Authentication on every endpoint**: `auth0.withApiAuthRequired` plus an
  explicit `session.user.sub` check on all API routes; pages use
  `withPageAuthRequired` / `withOnboardingGuard`.
- **Authorization**: every foreign key from the client (`categoryId`,
  `paymentMethodId`, `accountId`, tag ids) is checked to belong to the caller,
  else 403. Firestore rules are owner-only per collection; the client SDK
  only reads. The `rates` collection is not in the rules, so clients cannot
  touch it.
- **Input validation**: Zod schemas at every boundary with length caps and
  enum-constrained currencies; `last4` cannot hold more than four digits.
- **Transport and headers**: HTTPS by Vercel; `X-Content-Type-Options`,
  `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`.
- **Secrets**: env vars only; service-account key never committed.
- **Minimisation**: no analytics, no error-reporting SDK, no third-party
  scripts, no name/email in the database.
- **Rights, self-service** (this branch):
  - Access / portability: `GET /api/account/export` → one JSON file with
    every collection, Timestamps as ISO strings (`helpers/userData.ts`).
  - Erasure: `DELETE /api/account` hard-deletes every owned document in
    batches, the user doc, the Firebase Auth user, and — when
    `AUTH0_MGMT_CLIENT_ID` / `AUTH0_MGMT_CLIENT_SECRET` are set — the Auth0
    identity via the Management API (`lib/auth0Management.ts`). The client
    then logs out. This is the one deliberate exception to the "never
    `.delete()`" rule in `AGENTS.md` §3.
  - Transparency: `/privacy` (public) and Settings › Data & privacy.
  - Gravatar is off by default and opt-in per user (`users.showGravatar`).

---

## 5. Gap analysis

| #   | Requirement                                                     | Before this branch                             | Status                                                                  |
| --- | --------------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------- |
| 1   | Privacy notice (GDPR art. 13; Ley 1581 art. 12, 17; FTC)        | none                                           | **Done** — `/privacy`                                                   |
| 2   | Access + portability (GDPR art. 15, 20; Ley 1581 consulta)      | "Coming soon."                                 | **Done** — export                                                       |
| 3   | Erasure (GDPR art. 17; Ley 1581 supresión)                      | `mailto:`                                      | **Done** — delete account (Auth0 identity needs M2M creds, else manual) |
| 4   | Third parties disclosed and lawful                              | Gravatar called silently on every page         | **Done** — opt-in + disclosed                                           |
| 5   | Honest in-app claims                                            | "securely stored in the cloud", no policy      | **Done** — copy names the processor and links the policy                |
| 6   | Record of processing (GDPR art. 30)                             | none                                           | **Done** — §2 of this document                                          |
| 7   | Processor DPAs + transfer mechanism (GDPR art. 28, ch. V)       | not recorded                                   | **Operational** — §6                                                    |
| 8   | Data location decision                                          | region undeclared                              | **Operational** — §6                                                    |
| 9   | Backups / point-in-time recovery, breach procedure (art. 32–34) | none                                           | **Operational** — §6                                                    |
| 10  | Colombian authorization at signup                               | implicit                                       | Phase 2                                                                 |
| 11  | Retention: `rates` TTL; log hygiene                             | grows forever; callback error reflected in URL | Phase 2                                                                 |
| 12  | CSRF Origin check on mutating routes, rate limiting, CSP        | none (relies on Auth0 cookie `SameSite`)       | Phase 2                                                                 |
| 13  | Firestore rules emulator tests; `pnpm audit` blocking in CI     | none / `continue-on-error`                     | Phase 2                                                                 |
| 14  | Separate production Firebase project, least-privilege SA        | `sublr-dev` is the default target              | **Operational** — §6                                                    |
| 15  | DPIA screening                                                  | none                                           | §8                                                                      |

---

## 6. Operational checklist (outside the repo)

Do these once per deployment and note the date next to each.

1. **Firestore location.** Confirm the project's Firestore location in the
   Firebase console. For an EU + Colombia + US user base, an EU region
   (e.g. `europe-west1`, `eur3`) is the simplest defensible choice: GDPR
   transfer rules only bite when data leaves the EEA, and neither US nor
   Colombian law objects to EU storage. Set `NEXT_PUBLIC_DATA_REGION` to a
   human-readable value ("Belgium (europe-west1)") so `/privacy` states it.
   The location cannot be changed after creation; if the current project is
   in the wrong region, create the production project in the right one.
2. **Production project.** Create a separate Firebase project for
   production; keep `sublr-dev` for development. Deploy rules and indexes
   there (`pnpm firebase:deploy` with the right `--project`). Give the
   production service account only the roles it needs (Cloud Datastore
   User + Firebase Authentication Admin), not Owner.
3. **Point-in-time recovery.** Enable Firestore PITR (7 days) on the
   production database, and schedule daily exports to a Cloud Storage
   bucket in the same region with a lifecycle rule (30 days). Note the
   backup window in the privacy policy if it differs from "up to 30 days".
4. **Auth0 tenant.** Confirm the tenant region (EU if available). Enable
   MFA. Turn on breached-password detection and brute-force protection.
   Create a Machine-to-Machine application with `delete:users` on the
   Management API and set `AUTH0_MGMT_CLIENT_ID` / `AUTH0_MGMT_CLIENT_SECRET`
   in Vercel, so account deletion removes the identity too. Until then,
   delete the user in the Auth0 dashboard when someone deletes their
   account (search by the `sub` in the deletion log line).
5. **Data-processing agreements.** Accept and archive (PDF + date):
   Google Cloud DPA, Okta/Auth0 DPA, Vercel DPA. Record the SCC module
   each relies on.
6. **Contact.** Set `NEXT_PUBLIC_SUPPORT_EMAIL` to a mailbox that is read.
   It is the address for privacy requests, consultas and reclamos, and is
   printed on `/privacy`.
7. **Breach response.** Write down, in one page: who notices (Vercel and
   GCP alerting, Auth0 anomaly emails), who decides, how affected users are
   contacted (email via Auth0's user list), and the 72-hour clock to notify
   the supervisory authority (IMY for Sweden; SIC for Colombia has no fixed
   deadline but expects prompt notice). Keep the page next to this file.
8. **Vercel.** Enable the Web Application Firewall's basic rate limiting
   on `/api/*` until the in-app limiter (phase 2) lands. Review the log
   retention setting (default is short; do not extend it).
9. **Storybook.** The component workbench is public at `/storybook` with
   synthetic data. Either keep confirming the fixtures contain nothing real
   (`stories/fixtures/`) or protect the path with Vercel Deployment
   Protection.
10. **Colombia authorization.** Add an explicit line at signup /
    onboarding ("By continuing you authorise Waletto to process your data
    as described in the privacy policy, including on servers outside
    Colombia") and log the timestamp on the user doc (phase 2).

---

## 7. Phase 2 backlog (code)

- **CSRF hardening**: reject state-changing API requests whose `Origin`
  (or `Sec-Fetch-Site`) is not the app's own origin. Small middleware
  shared by all routes; Auth0's `SameSite=Lax` cookie already blocks most
  cross-site POSTs, this closes the rest.
- **Rate limiting** on `/api/*`, especially `/api/currencies` (metered
  upstream) and `/api/transactions/materialize` (batched writes).
- **Content-Security-Policy** with a nonce for the theme boot script in
  `pages/_document.tsx`; `connect-src` limited to Firestore, Auth0 and
  (when opted in) Gravatar.
- **Retention**: a TTL policy on `rates` (Firestore TTL field) so the FX
  mirror keeps ~90 days; stop reflecting the Auth0 error text into the
  `/login-error` URL (log it server-side, show a generic code).
- **Firestore rules tests** with the emulator; make `pnpm audit --prod`
  blocking in CI.
- **Authorization capture** for Colombia (see §6 item 10).
- **Compliance gate for bank integrations**: before any aggregator lands,
  revisit §1 — PSD2/AISP licensing or an agent arrangement, PCI scope,
  token storage and encryption, and a DPIA become mandatory.

---

## 8. DPIA screening

Financial data at scale is on the EDPB's list of processing that may
require a Data Protection Impact Assessment. For Waletto today: one
controller, manual data entry, no profiling, no automated decisions, no
bank access, no sharing, small user base → a full DPIA is not required.
Re-run this screening when any of these changes: bank integration,
analytics, sharing between users, AI features that read the ledger, or a
user base large enough to trigger state-law thresholds.
