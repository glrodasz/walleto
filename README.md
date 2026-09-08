This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## What this app does

Waletto tracks subscription expenses, savings and investments, and gives a
money-flow view of your finances (net = income − expenses − savings −
investments). It supports multiple currencies first-class: every amount
stores its native currency, and reporting converts through live exchange
rates into a per-user display currency.

- **Dashboard** (`/`) — net-flow hero, per-domain stat cards, monthly
  income-vs-expense bars (the month in progress drawn lighter), expense
  breakdown, recent payments, next to expire.
- **Incomes / Expenses / Investments / Savings** (`/incomes`, `/expenses`,
  `/investments`, `/savings`) — one month-first page (`DomainPage`) per
  domain: a month picker, the month's figure with a spent-vs-expected bar
  (expected = what landed + what active recurring items still owe before
  month end), seven monthly bars with a 6-month average line, and three
  views of the selected month: Categories (totals, share, planned vs actual,
  drilldown with subcategories), Transactions (grouped by day) and Recurring
  (the month's bills as overdue / due / paid, with mark-paid, edit, stop).
  Expenses' Subscriptions category surfaces subscription cost insights;
  Investments adds a valuation panel per category (invested vs value, gain-%
  history, chart).
- **Prospect** (`/prospect`) — a what-if simulator: check any recurring
  expense, investment or saving to see the monthly/annual amount it would
  free and how your net would change, projected 6 or 12 months out.
- **Methods** (`/methods`) — payment methods CRUD (cards, wallets, bank
  transfers, cash, crypto).
- **Settings** (`/settings`) — account info, main reporting currency, redo
  onboarding.

One-off transactions (a coffee, an invoice) are recorded through the create
button — the header's New buttons on desktop, the floating "+" on phones —
which asks whether you mean a single dated payment or a recurring item. Each
domain page lists what was recorded in the selected period, with delete.
Six months of synthetic PAID transaction history is backfilled from active
recurring items on first dashboard visit (`useMaterialize`), idempotently.

## Getting Started

First, run the development server:

```bash
nvm use   # uses .nvmrc (Node 24)
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.js`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.js`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Local Environment Setup

This project uses Firebase Firestore as database and Auth0 as Auth provider so you have to complete some steps before running the project locally, those are listed below:

1. Create a `.env.local` file into the root and copy the content of `.env.local.example` inside
2. Create a firebase project at the [Firebase Website](https://firebase.google.com), go to project config, click "Add application" and add a web app.
3. Take the credentials provided by firebase to your web app and copy them into `.env.local`
4. In your firebase project config go to "Service accounts" and click "Generate new private key". It will download a json file, change it's name to `serviceAccountKey.dev.json` and paste it in the project's root `/firebase` folder
5. Go to [Auth0 website](https://auth0.com) and create and account if you don't have one or log in
6. Create a web classic project and select Next JS as technology
7. Copy your Auth0 application config from "Settings" and paste it in their respective variables inside the `.env.local` file
8. Follow the Auth0 example to configure the callback URL's

Now the project is ready to run. Run the project to check everything is working fine and the subscriptions list will now show empty because you won't have any data in your firestore database.

To populate your Firestore database run the two seed scripts:

```bash
# 1. Seed the global services catalogue (Netflix, Spotify, etc.) — run once
pnpm seed:global

# 2. Preview the demo profile without writing anything (no credentials needed)
pnpm seed:user <userId> --dry-run

# 3. Seed per-user demo data — run after first login
pnpm seed:user <userId>
```

To find your `userId`, add a temporary `console.log` in any page to print the Auth0 `user.sub` value after logging in.

### What the demo profile contains

`pnpm seed:user` writes a curated multi-currency profile (`data/testSeedData.json`):
USD as the main currency, with income in USD/EUR/COP, subscriptions billed in
COP against USD prices (so implied exchange rates show up), and expenses,
investments and savings across all four domains — roughly $6.8k/mo in, $2.1k/mo
of unallocated net.

- **It wipes first.** By default it deletes that user's categories, payment
  methods, recurrent transactions and transactions before writing. Pass
  `--no-wipe` to add on top instead.
- **History is derived, not hand-written.** Twelve months of PAID transactions
  are generated from the recurring items through the same
  `helpers/materializeOccurrences` the app uses, with the same deterministic
  `{itemId}_{YYYY-MM-DD}` ids — so the materializer that runs on dashboard mount
  finds them already there and never writes a duplicate.
- **It also seeds `users/{id}`** (main currency, onboarding marked complete) and a
  `rates/{today}` document, so conversion works even without
  `EXCHANGE_RATES_API_KEY`; a real key overwrites those rates on the first fetch.

## Firebase rules and indexes

Security rules live in [`firestore.rules`](./firestore.rules) and composite
indexes in [`firestore.indexes.json`](./firestore.indexes.json). Both are
deployed together with:

```bash
pnpm firebase:deploy
```

**Deploying the indexes is not optional.** Several queries — the per-domain
transaction history behind the charts and period totals, and the recent
payments list — combine equality filters with a range or an `orderBy`, which
Firestore refuses to run without a matching composite index. A missing index
fails the whole listener, so the panel renders empty rather than wrong. When
that happens the app now shows Firestore's own message, which includes a
one-click link to create the index it wants.
