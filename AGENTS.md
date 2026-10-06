# AGENTS.md

Conventions for **sublr**. The general rule: **small files with a single responsibility**, so every piece can be tested on its own and read at a glance.

Stack: Next.js 14 (Pages Router) · strict TypeScript · Firestore + `firebase-admin` · Auth0 · Zod · styled-jsx · Jest · pnpm 9.

---

## 1. Where things go

### `utils/` — generic, no business logic

Utilities that would work the same in any other project, lodash-style. They do **not** import from `types/`, `helpers/` or `features/`.

```
utils/request.ts               fetch wrapper
utils/sortByCreatedAt.ts       sort by createdAt, nulls last
utils/startOfPreviousMonth.ts  midnight on the 1st of the previous month
utils/formatList.ts            "A", "A and B", "A, B and C"
utils/decimal.ts               parseDecimal / sanitizeDecimal / toInputString / roundTo — numbers the way people type them (comma or dot)
utils/emphasis.ts              splitEmphasis — "a **b** c" into normal / bold runs (the intro copy)
utils/errorMessage.ts          UserFacingError + errorMessage(err, fallback) — what to show when a save fails (the API's `{ error: "…" }`, never a `flatten()`)
```

> If a utility needs to import a domain type (`Domain`, `Currency`, `Frequency`…), **it is not a util: it is a helper**. That's the quick test.

### `helpers/` — with project context

Same idea of a "utility", but it knows sublr's business.

```
helpers/aggregations.ts           monthly amounts per domain, rate-aware (see §3.1); rowSign / signed convertedAmount (direction OUT); shareByCurrency for the currency mix
helpers/fx.ts                     convert()/tryConvert() via cross-rates to USD, IDENTITY_RATES
helpers/currencies.ts             which currencies a picker offers (user's choice or USD/EUR/GBP) + "$ USD" options
helpers/chartData.ts              day/week/month buckets + income/expense series for FlowChart and MonthlyBarsChart
helpers/materializeOccurrences.ts occurrences of a recurring item within a range, deterministic ids
helpers/scheduleAnchor.ts         user's date choice → startDate (incl. "backfill" = 6 months back)
helpers/paymentMethodLabel.ts     "name - last4" for tables, "SEB - Autogiro (Bank transfer)" for dropdowns, and the spoken form
                                  ("Bancolombia, Debit card, ending in 8817") that names a MethodFace
helpers/paymentMethodOptions.ts   method types, network/provider suggestions, CARD_TYPES, sortByName/groupMethodsByType (wizard, Methods and PaymentMethodField)
helpers/accounts.ts               isAccountDomain (INVESTMENT | SAVING | DEBT), ACCOUNT_NOUN (account / pocket / debt), accountLabel, formatInterestRate
helpers/tags.ts                   normaliseTagName / tagKey (no spaces; lowercase key), tagNames (ids → names)
helpers/hidden.ts                 which ledger rows are hidden, and from where (dashboard / domain chart; via their recurring item or their category)
helpers/essential.ts              isSubscription / isEssential (the item's `essential` flag, or the guess) / essentialIsGuessed
helpers/dates.ts                  formatDate(date, style, format) — every visible date goes through here (user preference); monthKey
helpers/stacks.ts                 monthTotalsBy / monthTotalsByCategory — stacked monthly totals (top N + "Other"), per-domain tints
helpers/categoryTree.ts           categoryIdSet / rootIdMap — fold children into their root category
helpers/categoryIcons.ts          defaultIconFor(name, domain) / iconFor(category) — default icon when there's no pick
helpers/money.ts                  formatAmount / formatCompact / formatNative — how an amount is written (and how it's masked)
helpers/i18n.ts                   t(key, language) — catalog ("en" only) for the Settings strings
helpers/recurrence.ts             next occurrence by Frequency
helpers/seedDefaultCategories.ts  default categories
```

### `lib/` and `firebase/` — third-party configuration

Only singletons and SDK configuration. No logic of our own.

```
lib/auth0.ts         initAuth0
firebase/admin.ts    firebase-admin (server only)
firebase/client.ts   client SDK
```

### `features/<name>/` — grouped by feature

Everything that serves only one feature lives together:

```
features/
  onboarding/   the initial setup wizard + the access guard. Every screen is **intro + step**: on desktop
                (≥1200px) the left column is that screen's slide (`IntroPanel`: scene, label, h2 title and body;
                sticky) and the right column is the step; below that, a single column with the slide's text on top,
                no scene and no glass (`.card` becomes `display: contents`), so the form stays close. The pairing
                lives in `data/steps.ts` (`ONBOARDING_STEPS`: label, href, icon, accent, `tint`, `intro`, `summary`), the
                copy in `data/introSlides` (`INTRO_SLIDES`, a Record by id), and `stepNav(id)` gives the number,
                Back and Next: no page writes them by hand. Before step 1 comes the welcome (`/onboarding`,
                IntroPage): `planner` on the left (the only slide that keeps its scene when stacked: there's no form
                under it) and "What we'll set up" on the right (`SetupOverview`, one `ListItem` per step with its
                `summary`; each icon in its step's `tint` — `--setup-*` or the domain color, never `--accent`, which
                is red on staging; the stepper keeps the accent), no stepper, and "Start setup". The guard sends you there while `onboardingIntroSeen` is
                unset, and straight to step 1 after that. There's no separate tour: Settings › Setup has a single
                tool, "Run setup again" (re-seeds categories, sets `onboardingCompleted: false` and opens the
                welcome). Each scene is icons in IconDisc on a fixed 320×200 canvas (`intro/SceneCanvas`; id →
                scene in `intro/scenes`), and all the motion lives in `intro/SceneBit` (keyframes defined once;
                every step is its own route, so the scene enters again on each one).
                Six steps: Categories → Payment methods → Currencies → Income → Expenses → Review (currency comes
                right before Income: new rows start in `mainCurrency`). The stepper is
                tabs, not a sequence: each step is its icon (never "1."), and Income / Expenses take their
                domain's color (`--step-accent`; the progress bar follows the current step). On mobile only the current
                one keeps its name. Currencies (CurrenciesStep + hooks/useCurrenciesStep) is a single choice —
                "Your currency", which writes `mainCurrency` and `displayCurrency` together — plus which currencies the
                selects offer (`components/molecules/CurrencyToggles`, the same chips as Settings). Income and Expenses
                (RecurrentStep) group by cadence: each one is a `CadencePanel` with its "Add a monthly expense"
                inside, Monthly first and larger, the rest set aside under "Less often" — a cadence's "Add"
                never sits glued to the next one. Each row is a card on `--glass-sunken` with an `EditorFooter`
                holding just "Remove" (rows are always open: no Done). Saved rows are edited (RecurrentRowEditor; only the cadence
                section is fixed) and `save()` sends a PATCH with what changed (helpers/recurrentPatch; the
                schedule is compared as a choice with `isSameSchedule`, never by re-anchoring, which would drop the backfill).
                Review (ReviewStep + hooks/useReviewStep) shows the plan the way the dashboard will see it: the same
                `components/organisms/NetFlowCard` (income / expenses only) and the list of items with their monthly
                equivalent; "Finish" lives there.
                The wizard has no top arrow: Back, Next and the exit live only in the footer. Step 2 (MethodsStep, also in
                Settings) is a wallet: each method is a collapsed MethodFace; tapping it opens it (WalletItem +
                MethodEditor, one at a time, hooks/useOpenRow) and its `EditorFooter` is `Remove | Done` (see
                "Removing and action rows"). Saved methods are edited right there (only the type is fixed) and
                `save()` sends them as a PATCH with only what changed. Every step has an exit
                (ContinueLater: "Skip for now" on step 1, "Continue later" afterwards — useLeaveOnboarding saves
                the step, sets onboardingCompleted and returns to the dashboard; Settings › Setup reopens it)
  dashboard/    the home: monthly plan hero (`components/organisms/NetFlowCard` — shared with the onboarding
                Review —, with an "On plan" /
                "Over-committed" verdict), today's net worth (NetWorthCard + hooks/useNetWorth + helpers/netWorth) — both
                are the same piece, `components/molecules/SummaryCard` (title + pill, figure on the left,
                breakdown on the right; Prospect uses it too),
                per-domain stat cards ("planned per month"),
                5-domain cash flow stacked by category / currency (CashFlowCard + helpers/cashFlowSeries; by
                category / currency the tooltip is per bar — `StackTooltip` —, by domain it compares all five),
                top categories, upcoming plan payments; the tip goes at the very top
  domains/      DomainPage — the month-first screen shared by incomes/expenses/investments/savings/debts:
                the month comes from the header (hooks/useSelectedMonth), MonthSummary (first what's expected this
                month and how much arrived; then actuals vs the previous month),
                bars stacked by category or currency (ChartControls; the charts only display — the month
                is set by the header picker, which is why the list of months the page computes is longer
                than the one the bars draw), Top categories, and the views
                Plan (RecurringChecklist, the default view) / Activity (TransactionsTable with search/filters) /
                Categories / Tags / Payment methods (/ Worth, which is called Owed in debts). The hash keys are
                `plan` / `activity` / …; `#recurring` and `#transactions` still work (parseDomainView)
  methods/      MethodsList (saved methods as a wallet: one MethodFace per method, grouped by type) +
                EditMethodModal (with the full-size face as a preview) — used by Settings › Payment methods
                (the /methods page redirects)
  insights/     SubscriptionInsights — monthly/annualized subscription cost
  investments/  value per account / pocket / debt (and per category for what has no account): invested vs value,
                gain %, history; helpers/interest.ts estimates with the account's rate; a debt is the
                same piece with the sign flipped (positionSign): repaid vs owed, interest instead of gain;
                AccountValueList (Worth / Owed view), AccountValuePanels (drilldown), RecordValueModal ("+"),
                DomainValueLine (the "Worth …" on the dashboard cards); hooks/useDomainValue
                (listener from inception: mount it only where the figure is shown) and hooks/useDomainGains
  settings/     section tabs (General / Categories / Tags / Payment methods / Accounts & debts, the active one
                goes in the URL hash). General is six cards (Account, Currency, Preferences, Setup, Data &
                privacy, About) on SettingsCard + SettingsRow; Currency is a single "Your currency" row (see
                §3.1) and also curates the list of available currencies (CurrencyToggles); CategoriesSettings, TagsSettings and AccountsSettings
                paginate by 25 (`Pager`); MethodsSettings mounts the wizard's MethodsStep plus the list
  prospect/     the plan simulator, with two modes (the "Emergency mode" switch, ProspectModeToggle).
                What-if: CancelableItemsList groups what leaves the plan (helpers/rankCancelable) into Non-essential
                (first, most expensive on top, with "Cancel top 1/2/3" chips), Essential, Investing & saving and Debt
                payments; checking simulates cancelling and WhatIfSummary (SummaryCard) gives the month's net before and after.
                Emergency (EmergencyView, mounts the value listeners only while active): regular income
                is cut, non-essentials and all contributions are paused, and helpers/emergency.ts simulates month by month
                how long the cushion lasts (savings, + investments if the owner asks, + severance) paying
                essentials and debts, with unemployment benefit while it lasts — RunwayCard + EmergencyPanel
                (the emergency plan lives in the user doc, hooks/useEmergencyPlan). Like the dashboard, it leaves out
                `hiddenFromDashboard` items
  create/       CreateLauncher — the floating "+" button and its sheet (one-off payment, recurring, or an account's value?)
```

Each one has the same internal shape: `components/`, `hooks/`, `helpers/`, `data/`.

**The rule for deciding where something goes: count the consumers.**

- **A single consumer** → it moves down into the feature.
- **Two or more** → it moves up to the root, even if today it "looks like" it belongs to a feature.

Real examples: `Combobox` was born in the wizard and lives in `components/atoms/` because it's generic; `TabStrip` (segmented tabs with an accent) serves Settings, its per-domain cards and the DomainPage views; `utils/paginate` + `components/molecules/Pager` are the pagination for any list; `helpers/aggregations` and `hooks/useMoneyContext` look like they belong to `domains` but dashboard, insights and prospect use them too, so they stay shared. `hooks/useDomainTransactions` was born in `expenses/` (two consumers later: dashboard and domains) and moved up to `hooks/`.

> Watch out for barrels: `helpers/index.ts` re-exports, so a `grep` for the file name **won't** find whoever imports it as `from "../helpers"`. Count consumers by looking at the barrels too, or you'll move into a feature something three others use.

### Shared across features

```
components/atoms|molecules|organisms/   Atomic Design
hooks/                                  reusable hooks
schemas/                                Zod schemas
types/                                  domain types
constants.ts                            constants and presentation maps; MONTH_PERIODS (3/6/12) +
                                        parseMonthPeriod are shared by the domain chart and the cash flow
```

`components/atoms/EmptyState.tsx` and `components/atoms/ErrorState.tsx` are **different on purpose**: a broken Firestore rule or a building index must read as an error, never as "no data" — that ambiguity already emptied the wizard's category list once (see §3). `components/atoms/CheckboxField.tsx` is every checkbox option in a form: the `label` on top, the `hint` (the consequence or the warning, a sentence that starts with a capital letter and ends with a period) on its own line below in small, muted text, and an optional `tag` next to the label (always a `Badge size="sm"`, e.g. "Guessed from category", which doesn't make the line taller; if the tag needs explaining, it goes as the `trigger` of an `InfoTip` with an `Info` icon inside the pill — the click opens the tooltip and never ticks the box) — never the old "— …" glued to the label, which split the sentence and buried the option's name. `components/atoms/InfoTip.tsx` is the "i" with a tooltip (or, with `trigger`, any pill that explains itself) (hover, keyboard focus or tap; Escape / tapping outside closes it, and it shifts itself so it doesn't leave the viewport) — don't use `title=` to explain something nobody on mobile can see. `components/molecules/Modal.tsx` and `KebabMenu.tsx` are the building blocks of any new CRUD (create/edit in a modal, per-row actions in a kebab) — don't reinvent overlay or dropdown. `Modal` is a centered dialog on desktop and a **bottom sheet** below 768px (full width, `dvh`, safe-area, body scroll locked); long forms pin their action row with `position: sticky; bottom: 0` so Cancel/Save don't fall out of view. `components/molecules/Last4Field.tsx` is a card's "last 4" in the three method forms (wizard, inline creator, edit): `name="last4"` + `autoComplete="off"` and a note clarifying it's not the security code — on its own it read (and autofill filled it) as a CVV; it validates with `last4Error` before submitting. `components/molecules/MethodFace/` draws a payment method as what it is — card (EMV chip, contactless, embossed number and the network's mark: Mastercard circles, VISA, Amex; other networks as text), cheque, wallet app, hardware wallet, banknote, voucher — as a strip (`compact`) or whole (`full`, always with a real card's aspect ratio, 1.586). **A single geometry**: `FaceLayout` decides where each slot goes (emblem, title, corner, detail, footer, mark) for every type; a new type only chooses the material in the frame (`MethodFace.tsx`) and fills slots in `slots.tsx` — never its own positions or sizes, which is how the faces got misaligned the first time. It's decorative (`aria-hidden`), so whoever wraps it names it (`MethodFaceButton` + `paymentMethodDescription`). `components/molecules/CategoryField.tsx` and `PaymentMethodField.tsx` are the category and payment method selects with inline creation shared by both create forms.

**The only exception to "organisms don't import features"** is `PageLayout`, which mounts `features/create/CreateLauncher` (the mobile floating "+"): it has to exist on every page and every page is built on that layout. The two forms it opens are mounted only while open, so no page pays for their listeners.

### Storybook

`pnpm storybook` mounts each piece alone and in context, ordered by Atomic Design: **Atoms** and **Molecules** (`components/`), **Organisms** (`components/organisms/` and `features/*/components/`) and **Templates** (whole screens: `DashboardPage`, `DomainPage`, `ProspectPage`, `SettingsPage`, the wizard and `login-error`). Rules:

- The story is **colocated** next to the component, like the test: `Button.stories.tsx`. The `title` decides the level (`Atoms/Button`, `Organisms/Dashboard/CashFlowCard`, `Templates/Settings`). **Never** a story inside `pages/` (Next compiles it as a route; `__tests__/pagesDirectory.test.ts` guards this).
- Storybook doesn't touch Firestore or Auth0. `.storybook/preview.tsx` wraps everything in `UserProvider` (fixed user) and `PreferencesProvider`, and replaces every data hook in `hooks/` (and `firebase/client`) with its sibling in `__mocks__/` via `sb.mock()`. The mocks return a single demo profile from `stories/fixtures/` (categories, tags, methods, accounts, a multi-currency plan and the ledger derived with `helpers/materializeOccurrences`).
- A different state = a different hook: `mocked(useCategories).mockImplementation(...)` in the story's `beforeEach`; `resetStoryMocks()` restores the defaults before each one. Prop-driven components receive the fixtures directly (`STORY_CATEGORIES`, `STORY_CTX`…).
- A new hook that reads Firestore needs three things: its default in `stories/fixtures/hookDefaults.ts`, `hooks/__mocks__/<hook>.ts` with **every** name the real module exports wrapped in `fn()`, and its registration in `.storybook/preview.tsx` and in `stories/fixtures/mocks.ts`.
- Page bodies live in `features/*/components/*Page.tsx`; `pages/*.tsx` only exports `getServerSideProps` and mounts that component. That way a screen can be mounted outside `pages/`.
- CI runs `pnpm build-storybook`: a broken story breaks the pipeline.
- Vercel serves it at `/storybook` on every deploy: the `vercel-build` script runs `storybook build`, moves `storybook-static/` to `public/storybook/` and only then runs `next build`, so the static build is already inside `public/` before Next starts its own. (A direct `-o public/storybook` breaks: `.storybook/main.ts` has `staticDirs: ["../public"]`, and copying `public/` onto its own subfolder isn't valid — hence the intermediate step.) `next.config.js` **redirects** (doesn't rewrite) `/storybook` → `/storybook/index.html`: Storybook's `index.html` points to its assets relatively (`./sb-manager/runtime.js`), so the browser has to be inside `/storybook/` to resolve them — with a rewrite the URL stays at `/storybook`, the assets are requested against the root, they 404 and the page loads blank. That route also carries `noindex` and `X-Frame-Options: SAMEORIGIN`: the app's global `DENY` blocks the preview iframe (same origin) and leaves every story empty. `.vercelignore` doesn't exclude `.storybook/` or `stories/`: they're needed for that build to run on Vercel.

---

## 2. Styles

- **styled-jsx** inside the component (`<style jsx>{\`…\`}</style>`). We don't use CSS Modules.
- Always **design tokens**, never hand-written hex: `var(--bg-1)`, `var(--accent)`, `var(--r-md)`. The tokens are in `styles/globals.css`.
- **Two palettes**: light by default ("glass" over a landscape background) and dark (the original "Fintech-noir"), chosen by `data-theme` on `<html>`. An inline script in `_document` sets it before the first paint and `hooks/useTheme` follows it (preference in the user doc, `"system"` is resolved in JS with `matchMedia`; the tokens live only in those two blocks). Text on the accent: `--on-accent`.
- **The primary color is a single token per palette**: `--accent`. `--accent-soft`, `--glow`, `--ambient-1` and `--accent-hover` derive from it with `color-mix()` (`--accent-hover` moves away from `--on-accent`: darker in light, lighter in dark — an accent fill on hover only gains contrast; the FAB and `Button` primary use it, and since they carry `glass--tap` their `:hover` has to beat `.glass--tap`'s, which otherwise turns it into glass and sinks the icon), so changing the primary means changing that value in both blocks. On top of that, each build is painted differently so it's not confused with production: `_document` sets `data-env` on `<html>` from `helpers/buildInfo` and `globals.css` overrides `--accent` — production keeps each palette's own, staging (Vercel previews, `sublr.vercel.app`) is red and dev is green. That's why `--accent` is chrome only (navigation, focus, buttons): the sign of a figure (nets, gains, a paid row) uses `--positive` / `--negative`, which `data-env` never touches — with staging's red accent, every positive amount read as a loss. The favicon follows the same map (`buildInfo().favicon`: `favicon.svg` / `favicon-red.svg` / `favicon-green.svg`); the `.ico` and the touch icon are blue, so only production links them.

### Liquid glass: the material (important)

Every floating surface — Card, Sidebar, the bottom bar, menus, sheets, pills, chips, fields — is **the same piece of glass**, and that piece is implemented **only once**: the global `.glass` class in `styles/globals.css`.

```jsx
<div className="glass card">           {/* glass + the component's own styles */}
<nav className="glass glass--strong glass--raised walleto-bnav">
<button className="glass glass--tap btn btn--secondary">
```

- `.glass` — translucent fill (`--glass`), `backdrop-filter: blur() saturate()`, `--glass-rim` border, specular highlight on the top edge (`--glass-edge`, `--glass-edge-low`) and the `--glass-sheen` light sweep, plus `--glass-shadow`.
- `.glass--strong` — chrome that has to stay legible with content scrolling underneath (sidebar, bottom bar, sheets, a form's sticky action row).
- `.glass--raised` — large shadow, for what floats over the page (menus, the modal's sheet, the FAB).
- `.glass--tap` — reacts to the pointer: brightens on hover, sinks on `:active`. Goes on everything tappable.

**It's a global class on purpose.** The alternative was copying six declarations into twenty components and watching them diverge. styled-jsx is still the place for geometry (radius, padding, grid) and anything component-specific.

The rest of the vocabulary, for when something can't carry the class (a native `<dialog>`, a `::before`): `--glass-field` (fields: a well carved into the glass, not a tile), `--glass-inset` (a panel inside another panel: a card's stats block, a progress bar's track — no blur of its own, what's behind it is already blurred), `--glass-sunken` (a card set into an inset panel, one of a list of editable rows: one step darker, so neighbouring cards read apart — the Income / Expenses rows), `--glass-raised` (the raised pill of a TabStrip / SegmentedControl), `--glass-hover`, `--scrim` + `--scrim-blur` (overlays), `--shadow-sm/lg`.

**The only exception to glass is payment method faces** (`MethodFace`): a card or a banknote is an object resting on the glass, not a floating surface, so it carries its own paper / plastic / metal with the `--face-*` tokens (defined in both palettes, each ink next to the background it sits on). Don't use them for anything else.

**Never put `background: var(--bg-1|2|3)` on a visible surface.** That's how the material breaks: an opaque tile on the glass. The `--bg-*` tokens are for the page background and for what the browser draws on its own (`select option`).

The background matters as much as the glass: the `--bg-image` landscape is never fully covered and `body::before` leaves ambient light fixed to the viewport (`--ambient-1..3`), so a card below the fold also has color to refract. Without it the material reads as a gray panel.

Motion: `prefers-reduced-motion` (global rule in `globals.css`) sets duration **and delay** to zero — a staggered piece with `animation-fill-mode: both` would be invisible during its delay. A new animation may only delay the final frame, never hide content.

Two degradations, both in `globals.css` and both only remove translucency (the geometry doesn't change): `@supports not (backdrop-filter)` and `prefers-reduced-transparency: reduce` make `--glass*` opaque, and the latter also turns off sheen, edges, blur and `--scrim-blur`.

### List rows: `ListItem` (important)

Any "name · data · amount" row is `components/molecules/ListItem.tsx`, wrapped in its `ListItems`. Don't write another one: thirteen different implementations of the same row came to exist, with the name at 0.85/0.88/0.9rem, the amount at four sizes and half the time without `font-weight` — meaning the row's main number weighed less than its label.

The scale lives there, once: name and amount at `0.95rem` (600 / 700 tabular mono, `--fg-0`), meta and note at `0.75rem` (`--fg-2`), the amount's footer at `0.72rem`. Two size steps and one weight step, nothing more.

The slots: `leading` (IconDisc, DateBadge), `name`, `badges`, `meta`, `note`, `progress`, `amount`, `amountMeta`, `trailing`, plus `onClick` / `href` / `muted`.

- **`badges` always use `Badge`** (`components/atoms/Badge.tsx`), never a custom span: the atom brings `white-space: nowrap`, and without it "HIDDEN ON CHART" wraps onto two lines. They go on **their own line, bottom left** of the text block (after meta / note / progress): there they don't compete for width with the name or the amount, and three tags read as a group instead of pushing the name into an ellipsis.
- **The two "Hidden" marks are told apart by icon**, because the word alone isn't enough anymore: `Chart` = hidden from the domain chart (categories), `Home` = hidden from the dashboard (recurring items) — the same icon the sidebar uses for that screen. In the ledger the reasons come from `hiddenRowReasons` (`helpers/hidden.ts`), which returns a list (`"chart"` first, then `"dashboard"`): a row matching both gets two pills. Only `"chart"` dims the row (`muted`): what's hidden from the dashboard still counts on its domain page. The icon goes in `Badge`'s `icon` prop at `size={12}` (the `caps` pill is 0.64rem) and is decorative: `aria-hidden` comes by default in `Icons.tsx`, so the accessible name is still the text.
- **`meta` is a single, already-joined string** ("Sep 25 · Monthly · Housing · Visa - 4242"). There are tests that look for it as a single text node, and that way the ellipsis falls at the end and not inside a column.
- **`trailing` stays outside the clickable area** (the kebab can't live inside the row's button); `amount` stays inside.

- Per-domain accents: `--domain-income`, `--domain-expense`, `--domain-investment`, `--domain-saving`, `--domain-debt`, their soft tints `--domain-*-soft` and the `--tint-{domain}-1..6` ramps for category-stacked bars. **Never** put `color-mix()` in a JS string (recharts doesn't understand it in SVG attributes): define the token in CSS and pass `var(--x)`.
- Icons: `components/atoms/Icons.tsx` (Feather stroke). Category icons are picked by key (`constants.ICON_KEYS`) in `CategoryIcon`; with no pick, `helpers/categoryIcons` decides by name.

### Removing and action rows (important)

**Never an icon-only × in a column beside a form's fields.** It took 52px from every field on a phone (the Income / Expenses rows were like that). Removing an editable item — a row in a list of editable rows, an open editor — goes in its footer: `components/molecules/EditorFooter.tsx`, a right-aligned `Remove | Done`.

- **"Remove" is `Button variant="danger"`**: the `Trash` icon plus the word, in `--accent-hot` at rest and on hover (never the accent, which is red on staging and green in dev). Its accessible name names the item (`removeLabel="Remove Rent"`), since there's one per card.
- **"Done"** closes an editor that collapses (payment methods). An always-open editor (Income / Expenses rows) has no Done: the footer is just Remove, still on the right.
- **Every action row is right-aligned, dismissive first and primary last**: `Cancel | Save`, `Remove | Done`. Modals, inline edits (AccountsSettings, TagsSettings' rename) and creators follow it; nothing is pushed to the opposite edge.
- **What × is still for**: closing (the Modal's top-right ×: it closes, it doesn't delete), a `Chip`'s × inside the pill (removing a chip, not a form), and dismissing a `TipBanner`. A read-only list row puts destructive actions in its kebab with `danger` (also `--accent-hot`, hover included).

### Specificity trap (important)

`styles/globals.css` styles **every** `input` and `select`:

```css
input:not([type="checkbox"]):not([type="radio"]) { … }   /* (0,2,1) */
```

styled-jsx compiles `.input` to `.input.jsx-hash`, which is only `(0,2,0)` — **the global wins**. To override you have to nest:

```css
.control .input { … }   /* (0,4,0) ✓ */
```

That detail caused a double border in the wizard. Also watch out for `select`, which brings its own chevron via `background-image`: if the component draws its own icon, you need `background-image: none`.

### The `className` on child components trap (important)

styled-jsx does **not** add its scope hash to the `className` you pass to a child component (`<Link className="nav-item">`, any custom component). The rule compiles to `.nav-item.jsx-hash`, the rendered `<a>` only has `nav-item`, and the CSS is dead **without any error**. The whole Sidebar was like that: icons glued to the text, no padding or hover. The way out is `:global()` from a scoped parent, never inline styles:

```css
.nav :global(.nav-item) { … }        /* ✓ applies to Link's <a> */
.nav :global(.nav-item.is-active) { … }
```

Same pattern in `pages/index.tsx` (`.row > :global(*)`). If you're styling something that isn't a literal DOM element in that JSX, assume you need `:global()`.

### The render helpers trap (important)

The scope hash is only stamped on the JSX returned by **the component itself**. A helper function inside the component (`const renderRow = (o) => <li className="row">…`) returns elements **without** the hash, and their rules are just as silently dead — that's how the Recurring checklist shipped with all the text glued together. The way out is a child component with its own `<style jsx>` (`ListItemBody` in `components/molecules/ListItem.tsx`, `SettingsRowBody` in Settings), never a helper that returns JSX.

**And careful: a `const` holding JSX falls into the same trap**, even though it isn't a function:

```jsx
const body = // ✗ comes out without the hash
  <span className="main">…</span>;
return <li className="row">{onClick ? <button>{body}</button> : <div>{body}</div>}</li>;
```

It's the tempting pattern when the wrapper changes (button / link / div) and the content doesn't. The Tags list was like that: the `<li>` compiled with the hash and everything inside without it, so name, amount, bar and meta ended up glued together with no hierarchy at all, and no error anywhere. You can check it in the bundle: if in `.next/static/chunks/*.js` you see `className:"main"` without a `jsx-…` in front, that CSS is dead. The way out is the same: the content is a child component with its own `<style jsx>`, and the parent's rules that touch it go through `:global()`.

---

## 3. Data

**Reads** — a hook with `onSnapshot`, always guarded:

```ts
const { ready } = useFirebaseAuth();
useEffect(() => {
  if (!ready || !user?.sub) return;
  return onSnapshot(q, onNext, onError);
}, [ready, user?.sub]);
```

**Writes** — always a `fetch` to an API route. The client never writes directly to Firestore, even if the rules allow it. That's why there's no latency compensation: the screen only changes when the listener returns the server's copy, and on mobile that can take up to a remount. Boolean flags toggled with a tap (`hiddenFromDashboard`, `hiddenFromChart`, `essential`…) go through `hooks/useOptimisticPatches` inside `useRecurrentTransactions` / `useCategories`: they paint instantly and the override drops when a snapshot matches (or reverts if the write fails). The snapshot is still the source of truth; dates and `null` are not applied optimistically.

**Fast loading** (don't undo this without measuring):

- `firebase/client.ts` uses `persistentLocalCache` in the browser: a reload paints from IndexedDB (`fromCache`) and only syncs the difference — even for queries from `INCEPTION`. That's why "Log out" goes through `hooks/useLogout` (signOut + `terminate` + `clearIndexedDbPersistence`): nothing financial stays on a shared device.
- `useFirebaseAuth` waits for `auth.authStateReady()` and reuses the restored session if its uid is the Auth0 `sub`; `/api/firebase` is only called on the device's first login (or if the user changed).
- `useUserDoc()` reads the copy from `UserDocProvider` (in `_app`): a single listener on `users/{sub}` for the whole app. Outside the provider it subscribes on its own.
- `withOnboardingGuard` runs on every navigation (client-side ones too, via `/_next/data`), so it caches `onboarded: true` in the Auth0 session and stops reading Firestore; `PATCH /api/user` keeps it in sync when `onboardingCompleted` changes.
- A form (modal) is mounted **only while it's open** and imported with `next/dynamic`: closed, it opens no listeners and adds no weight to the page's bundle.
- One loading state per section, not one per page: each card appears when _its_ data arrives (`useDashboard().loading.cashFlow | expenseCategories | upcoming`).

**Indexes** — a query that combines equality filters with an `orderBy` on another field, or with an inequality (`>=`), **needs a composite index** in `firestore.indexes.json`. Several equality filters alone **don't** need one. If it's missing, `onSnapshot` fails and the list stays empty. This error already emptied the wizard's categories once and, later, the totals and charts of every domain screen — because declaring the index isn't enough: **you have to deploy it** (`pnpm firebase:deploy`). For small collections it's usually cheaper to filter and sort on the client and not depend on the deploy (see `hooks/useCategories.ts` and `features/dashboard/hooks/useUpcomingItems.ts`); for growing histories, the index is the right tool.

**Visible errors** — `ErrorState` receives the `Error` and shows its message as is; Firestore index errors bring the console URL that creates the index and are rendered as a link. Don't hide it behind friendly copy: that's exactly what turned an undeployed index into an empty, silent dashboard.

**Other rules**

- **Accounts / pockets / debts** (`accounts`): only for INVESTMENT, SAVING and DEBT (`helpers/accounts.ts`). Categories classify; the account is _where_ the money is (or who it's owed to), so valuations and interest hang off it. `accountId` is optional on recurring items and transactions (occurrences inherit it from the item via `occurrenceToTransaction`); what has no account falls into the domain's "No account" bucket (`ValueSelector = { accountId } | { domain }`; the bucket only matches rows **without** an account so nothing is counted twice). Every new valuation carries `domain`; those from before accounts only have `categoryId` and `valuationDomain()` resolves them via the category (INVESTMENT if there's none). Accounts are edited/archived in Settings (`features/settings/components/AccountsSettings`). `interestRate` is stored the way the bank quotes it (`{ value, period: MONTHLY | YEARLY }`); `features/investments/helpers/interest.ts` turns it monthly (YEARLY is the nominal rate the bank prints: it's divided by 12, not decomposed — 2.85% on 606,673 is the statement's 1,441 of interest) and compounds by whole days from each deposit (a check is read as is on the day it was recorded); a recorded value check takes over from its date. Moreover, a value check **counts** in the domain page's totals: `features/investments/helpers/valuationGains.ts` chains the checks per selector and measures each one against what the position should have been worth if nothing had moved — the previous check's value plus deposits since then (`depositsFor`), or everything contributed up to that day for the first one — with every term converted to the reading currency **at today's rate**. That way the chain telescopes into an identity that holds on any day and in any currency: `contributions + Σ gains = last check's value + later deposits`, exactly what the Value view shows for an account with no rate. The `costBasis` the check stores **is not used for totals**: it froze one day's rate and, when that moved, the category read 98 SEK less than the account summing it; it stays for the history and the check's own %. That's why `DomainPage` subscribes to transactions from `INCEPTION` for INVESTMENT and SAVING (the Value view already opened that same query; the SDK folds them into a single target) and `useDomainGains` reports nothing until the ledger has loaded. Corollary: editing or backdating a contribution reattributes the gain of an already-closed month — the ledger rules. Each check also names the **category** its gain belongs to (`categoryId`, chosen, never derived: an account can have several holdings; `dominantCategoryId()` only prefills the form). That's why an archived gain is added to its category's segment in the bars (via `gainRowsAsTransactions`, which disguises it as a ledger row to reuse the ranking and the "Other" cap) and to its row's total in `categoryMonthRows` / Top categories. What nobody archived — and everything in currency mode, because a gain isn't denominated in anything — goes to its own series (`__gain`, `var(--bar-gain)`, `features/domains/helpers/gainStack.ts`) and to a "Gain" row at the end of the list. `MonthSummary` breaks down the month. A negative gain is drawn below the axis (`stackOffset="sign"` in `MonthlyBarsChart`), never clipped. `useAllInvestmentValuations(enabled)` is how /incomes and /expenses share the page without opening the listener. `AccountField` is the `CategoryField` pattern with an inline creator. **A debt is a negative position** (`positionSign` in `features/investments/helpers/valuation.ts`): its transactions are repayments, its value check stores the owed balance as a positive number and enters the same math as `−value`, so the balance compounds upward with the rate, each repayment compounds downward, and the gains chain reports interest as a negative gain ("Interest" in the UI; the month's figure is repaid − interest). A debt's first check anchors the chain with a gain of 0 — the loan was never a transaction to measure it against — and without any check the balance is unknown: `currentValue` returns 0 and the UI shows "—", never the interest-based estimate used for an asset. `interestAccrued` (`helpers/interest.ts`) is what the repayments don't explain since the first balance.
- **Essential** (`essential` on `recurrentTransactions`): only means something in EXPENSE — whether the expense stays in Prospect's emergency mode. Without the flag it's guessed (`helpers/essential.ts`: subscriptions and the "Variable" category aren't essential, everything else is — guessing essential shortens the runway, which is the safe error); DEBT is always essential and INVESTMENT / SAVING never are. The create/edit modal shows the guess and only sends the flag when the owner touches it; Prospect changes it from each row's kebab. **Emergency plan** (`users.emergencyPlan`: `currency`, `benefitMonthly`, `benefitMonths`, `severance`, `includeInvestments`): always written whole (0 = none), because a `set` with merge would leave old fields behind.
- **Tags** (`tags`): a global per-user entity. `name` keeps capitalization but has no spaces ("Trip 2026" → `Trip2026`); `key` is the lowercase `name` and is unique per user (POST 409 if there's a live one with the same key; if there's only an archived one, it revives it). Rows (`recurrentTransactions`, `transactions`) store **ids** in `tags: string[]` and the routes check with `db.getAll` that they belong to the user; names are resolved at render time with `tagNames` (`DomainPage` does a single `useTags()` and passes it down like `paymentMethods`). `TagsField` (chips + Combobox) reuses by key before creating. `note` is free text in both collections. **Inheritance**: `inheritTags` / `inheritNote` on the item make `occurrenceToTransaction` copy tags / note to each occurrence (materializer, mark-paid and seed). When editing an item with inheritance on, the modal offers "Also update the existing payments": the PATCH receives `applyToExisting: true` (never stored), rewrites the rows with `recurrentTransactionId == id` in batches of 450 and responds `{ id, updated }`. A hand-edited row diverges until the next "also update".
- Soft delete: `archived: true` on categories, payment methods, accounts and tags, `active: false` on recurring transactions, `status: "SKIPPED"` on transactions. Never `.delete()` on something another doc references. The only exception is `investmentValuations`: a data point nobody points to, it's deleted for real.
- **Dates of a recurring item**: the UI never writes `startDate` by hand; it passes the user's choice (pay day, month+day, date) through `helpers/scheduleAnchor.ts`. "Backfill the last 6 months" isn't a field: it's the same `startDate` moved 6 months back, and the materializer does the rest. After creating something dated in the past, call `materializeNow()` so the history shows up without waiting for another session.
- `createdAt` with `serverTimestamp()`. It arrives as **`null`** in the local echo before the server resolves it: any sorting or formatting has to tolerate it.
- Optional fields are **omitted**, not sent as `null` in `POST`. In `PATCH`, on the other hand, `null` means "delete this field" (`FieldValue.delete()`) — that's how `chargedAmount`/`chargedCurrency`/`paymentMethodId` are cleared without a separate endpoint.
- Materialized occurrences use a **deterministic id** `{itemId}_{YYYY-MM-DD}` (`helpers/materializeOccurrences.ts`): recreating the range never duplicates or overwrites one the user already edited or skipped.

### 3.1 Money and currencies

Every amount is **stored in its native currency** and **converted only on read**. The single conversion point is `helpers/aggregations.ts` (`convertedAmount`/`toMonthlyAmount`/`sumMonthly`/`groupByCategory`/`computeMoM`/`computeFlow`), all of which take a `MoneyContext = { rates, target }`. It's also **the only place where a row carries a sign**: `amount` is always stored positive and a one-off transaction in a domain with accounts can carry `direction: "OUT"` (a withdrawal; in a debt, money borrowed), which `convertedAmount` returns as negative via `rowSign`. That way cost bases, month totals, stacks, the gains chain and interest net out withdrawals without knowing they exist. Recurring items never carry a direction; incomes and expenses don't either (the route rejects it with 400). Consequences: the month's figure in Investments/Savings/Debts is **net** (`MonthSummary` breaks down "contributed · withdrawn"), shares are computed over what came in — `Σ max(0, total)` — so a negative group doesn't inflate the others above 100%, `dominantCategoryId` only looks at rows that came in, a `costBasis` can be negative, and "Largest amount" sorts by magnitude.

- **`useSelectedMonth()`** (`hooks/useSelectedMonth.tsx`) is the month the whole app is looking at: state in React, mirrored in `?month=YYYY-MM` (shallow replace), never later than the current month; the header's `MonthPicker` changes it (its list shows the last 6 months and grows to 12 and 24 with "Show more" — that's why it's a custom portal menu, like `KebabMenu`, and not a native `<select>`; it opens at the step that contains the selected month) and domain pages clamp it to their bar window. `usePreferences()` / `useDateFormat()` (`hooks/usePreferences.ts`) read date format, week start and language from a context that `PreferencesProvider` fills from the user doc — presentation components never touch Firestore for this.
- **`useMoneyContext()`** (`hooks/useMoneyContext.ts`) is the only place that decides target currency and rates: `target = displayCurrency ?? mainCurrency`, `rates = useExchangeRates() ?? IDENTITY_RATES`. Any screen showing aggregated amounts uses it — don't read `mainCurrency` directly from `useUserDoc`.
- **A single currency choice**: for the owner there's one, "Your currency" (onboarding's Currencies step and Settings › Currency), and it writes `mainCurrency` (the one every new record starts with) and `displayCurrency` (the one totals are converted to) at once. The header selector is the only thing that moves `displayCurrency` on its own: reading the totals in another currency for a while, without changing the one for new records. That's why the user doc still has two fields.
- **`useEnabledCurrencies()`** (`hooks/useEnabledCurrencies.ts`) is the only place that decides **which currencies a select offers**: `users.enabledCurrencies` (the Settings › Currency chips) or `DEFAULT_ENABLED_CURRENCIES` (USD/EUR/GBP) until the user chooses, always with `mainCurrency` and `displayCurrency` included — those two can't be turned off. `CURRENCIES` is still what the app _supports_ (rates, types, Zod); this is only what's shown. Use `optionsFor(value)` when the field already has a value: a currency turned off after a record was saved doesn't disappear from its own select. The only exception is the onboarding Currencies step's "Your currency" (`CurrencyPicker`), which offers the whole catalog (`SELECTABLE_CURRENCIES`) because there's no choice to read yet — and right below it lets you pick the offered currencies, so nobody reaches Expenses without the currency they pay in.
- **Charged pair precedence**: if an item has `chargedAmount`/`chargedCurrency` and `chargedCurrency === target`, `chargedAmount` is used as is — what was actually charged beats any market rate.
- **`IDENTITY_RATES`** (`helpers/fx.ts`) are 1:1 rates — useful in tests and as a fallback when there are no real rates; with them the output is the raw sum (to mechanically verify a refactor).
- **Honesty about missing data**: `fxMissing` (there was never a cache) and `fxStale` (serving an expired cache or the server fallback) propagate up to the UI. A number is never made up — when `fxMissing` and currencies are mixed, a warning is shown instead of a fake sum (see `pages/index.tsx`).
- **`Amount`** (`components/atoms/Amount.tsx`): `colorize` for nets (`--positive` ≥0, `--negative` <0; never `--accent`), `markNegative` for dashboard figures (regular color ≥0, `--negative` with its "-" <0), `showCode` when the currency differs from the target, `approximate` prepends "≈" on converted aggregates. Decimals per currency via `ZERO_DECIMAL_CURRENCIES` in `constants.ts` (JPY, COP without cents), not a fixed `maximumFractionDigits`.
- **Every amount is written with `useMoneyFormat()`** (`hooks/useMoneyFormat.ts`), not with the `helpers/money` functions directly: the hook binds them to privacy mode (§3.5) and to the user's number preferences (`decimalSeparator` "." or ",", `decimals` 0–4; Settings › Preferences). The separator is applied on top of `formatToParts` in the `en-US` locale — never by switching locale, which moves the symbol — and the value is stored at full precision: it's only rounded for display. Percentages and rates go through the same hook's `formatPercent` / `formatNumber`. **Every typed number goes through `useDecimalInput()`** (`hooks/useDecimalInput.ts` on top of `utils/decimal.ts`): `sanitize` keeps digits and both separators (the mobile keyboard shows its locale's), `parse` decides what the user meant (the last separator is the decimal one; a repeated one groups; a single one is decimal unless it isn't theirs and is followed by exactly three digits: "1.000" for someone who types "1,5" is a thousand) and `toInput` writes a stored value into the field. A number field **never opens with a typed 0** (you'd type after it: "05000"): it opens empty with `placeholder="0"`, and anything prefilled goes through `toPrefill`, which leaves a 0 empty. No `Number(raw)` or `replace(/[^\d.]/g, "")` in forms. The pure functions are for tests and for what isn't React; if a helper function outside the component needs to format (`cardRows` in `pages/index.tsx`), it receives the formatter as a parameter.
- **`/api/currencies`**: 12h in-memory cache + daily mirror to Firestore (`rates/{YYYY-MM-DD}`) as a fallback; the client caches for 24h in `localStorage` (`hooks/useExchangeRates.ts`). Never call it without going through that hook.

---

## 4. API routes

The same skeleton in all of them (`pages/api/**`):

```ts
export default auth0.withApiAuthRequired(async (req, res) => {
  const session = await auth0.getSession(req, res);
  if (!session?.user?.sub) return res.status(401).json({ error: "Unauthorized" });
  const userId = session.user.sub;

  if (req.method === "POST") {
    const parsed = SomeInputSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    // someone else's resource → 403; duplicate → 409
    return res.status(201).json({ id });
  }

  res.setHeader("Allow", "POST");
  return res.status(405).json({ error: "Method not allowed" });
});
```

- Validation with **Zod** from `schemas/` at every input boundary.
- Every FK coming from the client (`categoryId`, `paymentMethodId`) is verified: it exists and belongs to the user → otherwise, **403**.
- Static routes beat dynamic ones: `/api/categories/defaults` doesn't clash with `[id].ts`.

---

## 5. Tests

- **Pure modules** (`utils/`, `helpers/`, `hooks/`, `components/`, `features/**`): test **colocated** next to the file.
- **API routes and pages**: in `__tests__/`, with `jest.mock` of `lib/auth0` and `firebase/admin` (see `__tests__/api/categories/index.test.ts`).
- **Never** a `*.test.tsx` inside `pages/`: Next compiles it as a route and breaks the build. There's a test guarding this (`__tests__/pagesDirectory.test.ts`).
- Separate the data hook from the component that renders it. That way the logic is tested without mounting UI — see `features/onboarding/hooks/useMethodsStep.test.ts`.
- If a test needs `firebase/client`, mock it: the module asks for real credentials on import.

---

## 6. Before pushing

```bash
pnpm tsc --noEmit
pnpm lint
pnpm test
pnpm build
pnpm build-storybook
```

That's exactly what CI runs (`.github/workflows/ci.yml`). **`pnpm build` is not optional**: it's the only one that catches broken routes, and green `tsc` + `jest` don't guarantee it.

Other notes:

- `pnpm seed:global` seeds the `services` catalog; `pnpm seed:user <userId>` seeds a user's multi-currency demo profile (`--dry-run` validates it and prints the summary without writing or asking for credentials; `--no-wipe` doesn't delete what's already there). The history is **not** hand-written: it's derived from the recurring items with `helpers/materializeOccurrences`, so it shares the app materializer's deterministic ids and mounting the dashboard duplicates nothing. If you touch `data/testSeedData.json`, run the `--dry-run` — it validates categories, methods, services and charged pairs.
- Husky + lint-staged format with Prettier on commit, so don't fight the formatting.

---

### 3.2 Hiding from the dashboard

The dashboard is the **run-rate of the recurring items** (the cards say so with "planned per month" and the hero with its "On plan" / "Over-committed" verdict); that's why only a recurring item can be hidden: `hiddenFromDashboard` on `recurrentTransactions` removes it from every number and list on the dashboard, and its ledger rows follow it via `recurrentTransactionId` (`helpers/hidden.ts`: `hiddenItemIds`, `withoutHidden`). Transactions have no flag of their own. Domain pages do **not** look at `hiddenFromDashboard` (they only label it, without dimming: the item still counts there); the Plan kebab only offers "Hide from dashboard". The only thing hidden from a domain's chart is a root category (`Category.hiddenFromChart`, kebab in Categories; children follow it): bars and the month's figure exclude it unless the owner turns on "Show hidden" (per-domain preference in `localStorage`), which only appears when some category is hidden. Lists always show everything, with the "Hidden" label.

### 3.3 Spreading monthly

A non-monthly item (yearly, quarterly, weekly…) with `spreadMonthly` is drawn on the domain page as **one slice per month** (`amount × FREQ_TO_MONTHS`, in its currency) instead of the real spike: `features/domains/helpers/spread.ts` (`spreadTransactions`) removes the item's real rows and adds synthetic slices with `recurrentTransactionId` and `categoryId`, so `helpers/hidden` hides them like any other row. `DomainPage` uses them for bars, the month's figure and Categories (`planItems` excludes those items from the plan so they aren't summed twice); the ledger and the Recurring checklist keep the real rows. The dashboard doesn't change: its cards already normalize with `toMonthlyAmount` and its cash flow bars show the real payment.

### 3.4 One-off vs recurring

There's **a single form** for everything that comes in: `RecurrentTransactionModal`. "Log a one-off expense" from the "+" opens it with `initialFrequency="ONE_TIME"`; editing a ledger row opens it with `transaction` (frequency fixed at One time, PATCH with only what changed). A `frequency: "ONE_TIME"` chosen there or in the wizard's One-time section **doesn't create a recurring item**: it writes a direct PAID transaction (`POST /api/transactions`). The plan (recurrentTransactions) is only what repeats; the ledger (transactions) is what happened. Old ONE_TIME items still work, but no more are created. **"This pays off a debt"**: in an expense form (creating or editing a recurring item, never a ledger row) a toggle files it under DEBT — the category becomes a debt one (the one with the same name, otherwise "Loans"), the debts `AccountField` appears and the item goes out with `type: "LOAN_PAYMENT"`. An existing item is moved with `POST /api/recurrent-transactions/[id]/convert` (`RecurrentTransactionConvertSchema`: only EXPENSE → DEBT), which rewrites `domain`/`categoryId`/`accountId` on the item and on all its rows in batches of 450 — `domain` is immutable in the PATCH and every FK check compares against it, which is why the modal converts **before** patching the rest and the PATCH no longer sends category or account. Deterministic ids don't change, so the materializer duplicates nothing, and what's been paid so far counts as repaid immediately. Nothing is subtracted twice from the net: Expenses goes down and Debts goes up by the same amount.

### 3.5 Privacy mode

The header's eye (`components/molecules/PrivacyToggle`) masks **the text** of every amount: `$****`, `COP ****` — the symbol or code stays, the whole number goes (never `$*,***.**`: the shape already gives away the magnitude, and so does the compact "K"/"M" suffix, so it's dropped). The flag lives in `hooks/usePrivacy` (context + `localStorage`, `walleto:privacy`): it means "someone is looking at my screen", a property of the device and not of the account, so it does **not** go to the user doc.

Nothing else changes. Bar heights, shares, progress, order and totals are still computed with the real numbers, so the screen keeps its shape and proportions — the chart still tells the month's story, just without figures. Two details: axis ticks are left **blank** instead of repeating four identical `$****` (`formatTick`), and form `input`s show the real value — you can't edit what you can't see. Percentages aren't hidden either: they're proportion, not money.

### 3.6 Vocabulary (important)

The app is a **planner**, not an expense tracker: it answers "what's my plan, is the month going well, and where do I stand?". The UI uses three nouns, always the same way:

- **Plan** — the recurring items: what should happen every month. Dashboard hero, Plan view, "Coming up in your plan".
- **Activity** — the ledger: what happened, planned or not. Activity view, bar charts.
- **Worth** — where the owner stands today: accounts and pockets minus debts. NetWorthCard, Worth / Owed view.

"Recurring" is only a cadence adjective, never the name of a screen or a figure. Verbs follow the same rule: an item is **added to the plan** ("Add … to your plan"), a one-off is **logged** ("Log a one-off …"), a position is **updated** ("Update current value / balance"). The "+" offers the plan first. Internal names (`transactions`, `recurrentTransactions`, `RecurringChecklist`) don't change: they belong to the model, not the UI.

## 7. Deferred on purpose

Explicit scope decisions, not oversights:

- **Production migration**: there's no migration suite in the repo. When it's time to promote, the owner pulls the prod data and a local script is written at that point — the current DB schema is the one we work with.
- **Persisting what-if scenarios** (`features/prospect`): what's checked lives in memory (`useWhatIf`) and is lost when leaving the page. What does persist is each item's `essential` flag and the user doc's emergency plan.
- **"Simulate cancel" entry points** from other screens (tables, insights) into a preloaded Prospect scenario — the page works standalone with its own checklist.
- **Manual budgets** per domain or category: the "spent vs expected" bar uses the plan (occurrences of the recurring items until the end of the month, `features/domains/helpers/months.ts`), not a typed number.
- **Skipping a future occurrence** from the Recurring checklist ("not this month"): it would require writing a SKIPPED doc with the deterministic id; today there's only Mark as paid and Stop.
- `endDate` on recurring items is in the type but never written; the forecast treats items as active until they're stopped.
- Scheduler / Cloud Functions, bank integrations, and a native mobile experience (today: bottom nav, "More" sheet, floating "+" and month-first pages — no gestures, toasts, offline or PWA).
