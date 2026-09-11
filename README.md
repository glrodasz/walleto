# Waletto

A personal-finance tracker built on four domains — **income, expenses,
investments and savings** — with a money-flow headline (net = income − expenses
− savings − investments) and native multi-currency support: every amount is
stored in the currency it was entered in and converted only for display.

Next.js 14 (Pages Router) · TypeScript · Firestore · Auth0 · Jest · pnpm.

- What each screen does: [`docs/product-overview.md`](./docs/product-overview.md)
- Code conventions: [`AGENTS.md`](./AGENTS.md)

## Requirements

- Node 24 (`.nvmrc`), pnpm 9
- A Firebase project (Firestore) and an Auth0 application

## Setup

1. Copy the environment template and fill it in:

   ```bash
   cp .env.local.example .env.local
   ```

2. **Firebase** — create a project, add a web app, and copy its credentials
   into the `NEXT_PUBLIC_*` variables. Then, under _Project settings → Service
   accounts_, generate a new private key and put its base64 into
   `FIREBASE_SERVICE_ACCOUNT_B64`.
3. **Auth0** — create a Regular Web Application (Next.js), copy its settings
   into the `AUTH0_*` variables, and add `http://localhost:3000/api/auth/callback`
   to _Allowed Callback URLs_ and `http://localhost:3000` to _Allowed Logout URLs_.

## Development

```bash
nvm use
pnpm install
pnpm dev          # http://localhost:3000
```

Other scripts:

```bash
pnpm test         # jest with coverage
pnpm test:watch
pnpm lint
pnpm tsc --noEmit # type check
pnpm build        # production build
```

### Seed data

The database starts empty. After the first login:

```bash
pnpm seed:global              # global services catalogue — run once
pnpm seed:user <userId>       # demo profile for one user (wipes their data first)
pnpm seed:user <userId> --dry-run   # preview, writes nothing
```

`<userId>` is the Auth0 `user.sub` of the logged-in user. Pass `--no-wipe` to
add on top of existing data.

## Deploy

The app deploys to **Vercel** — pushes to `main` go to production, pull requests
get preview deployments. CI (type check, lint, test, build) runs on every push
and PR.

Set the same variables from `.env.local.example` in the Vercel project.
`AUTH0_BASE_URL` must be set for _Production_ only; leaving it unset for
_Preview_ lets each preview build its callback URL from the request host. Add
the preview hostnames to Auth0's _Allowed Callback URLs_ and _Allowed Logout
URLs_.

Firestore rules and indexes are deployed separately:

```bash
pnpm firebase:deploy
```

Deploying the indexes is **not optional** — the charts, period totals and recent
payments queries combine filters with a range or `orderBy`, and Firestore
refuses to run them without a matching composite index.
