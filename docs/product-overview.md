# Waletto — product overview

Written as context for design work. It describes what the app is, how its data
is modelled, and exactly what each screen puts on the page. No code, no file
paths: a designer should be able to read this next to a screenshot and know
what every number and label means.

---

## 1. What the app is

Waletto is a personal-finance tracker built around **four domains** rather than
the usual two:

| Domain      | What it holds                                     | Accent |
| ----------- | ------------------------------------------------- | ------ |
| Income      | Salary, invoices, anything arriving               | Green  |
| Expenses    | Subscriptions, rent, groceries, anything leaving  | Red    |
| Investments | Money moved into brokerage or retirement accounts | Cyan   |
| Savings     | Money moved into savings pockets                  | Amber  |

**Net flow = income − expenses − savings − investments.** Savings and
investments are deliberately subtracted, not counted as spending: the headline
number answers "what is left unallocated each month", so money that stays yours
still leaves the pot.

### The two ideas everything rests on

**The plan versus the ledger.** A _recurring item_ is a rule — "Netflix, 15
USD, monthly, on the 14th". It is not money that moved. A _transaction_ is one
dated row in the ledger — money that actually moved. The app writes
transactions from recurring items automatically (backfilling six months of
history when an item is created with a past start date), so most rows in the
ledger have a recurring item behind them, and some are pure one-offs (a coffee,
a freelance invoice).

This split shows up everywhere in the interface: the dashboard is a _plan_
view (a monthly run-rate of the recurring items, and it says "Recurring" on
every card), while the domain pages are _ledger-first_ (what landed this month)
with the plan layered on as forecast.

**Multi-currency, natively.** Every amount is stored in the currency it was
entered in, never converted at write time. Conversion happens only when
something is displayed or totalled, into a per-user _display currency_. So a
list can show a 26,900 COP row and a 15.49 USD row side by side while the
total above it is a single converted figure. Supported: USD, EUR, MXN, GBP,
SEK, CHF, JPY, COP. Yen and Colombian pesos are written without decimals.

---

## 2. Data model

Nine collections. Everything except the service catalogue and the exchange-rate
cache belongs to one user.

### User

The account: a **main currency** (the default for new entries) and an optional
**display currency** (what totals are converted into, overriding the main one
per session). Plus whether onboarding is finished.

### Category

How an entry is classified, always inside one domain. Categories nest one level
deep: a **root** (Household) with optional **children** (Rent, Electricity).
Only roots appear in pickers and in Settings; a child's amounts fold into its
root everywhere totals are shown. A root can be **hidden from the chart**,
which takes it and its children out of the domain page's bars and month figure
but leaves it in the lists. Categories are archived, never deleted, so old
entries keep resolving their name.

### Tag

A free label shared across domains — "Trip2026", "Work", "Reimbursable". Tags
are global to the user, not per domain. The display name keeps the case it was
typed with but drops whitespace ("Trip 2026" is stored as "Trip2026"), and a
lowercase key makes each one unique: typing "trip2026" when "Trip2026" exists
reuses the existing tag instead of creating a twin. Entries store tag
references, so renaming a tag updates every row at once. Archiving a tag makes
it disappear from rows without touching them.

### Payment method

A card, wallet, bank transfer, cash or crypto wallet. Each has a **type**, an
optional **network or provider** (Visa, SEB, Wise), an **alias** (what the user
calls it), an optional **last 4 digits**, and the currencies it can charge in
with one default. Two methods clash only when type, network and alias all
match, so "Salary" bank transfers at two different banks coexist.

### Account / pocket

_Investments and savings only._ Where the money physically sits — "Avanza ISK",
"Emergency fund" — as opposed to what it is classified as. This distinction
matters because **value and interest attach to the account, not the category**:
you can hold two categories inside one brokerage account, and the account is
what has a balance. An account has a name, an optional **bank or broker**, a
currency, and optionally an **interest rate** as the bank quotes it (a
percentage plus monthly or yearly). Filing an entry under an account is
optional; everything unfiled lands in a single **"No account"** bucket per
domain.

### Recurring item (the plan)

A rule that repeats. Domain, category, optional account, name, amount and
currency, and a **cadence**: one time, weekly, twice a month, monthly,
quarterly or yearly. Twice-a-month items name two days of the month; the rest
anchor to a start date. Also carries an optional payment method, tags, a note,
and four behaviour flags:

- **Hidden from dashboard** — the item and every payment it wrote leave every
  dashboard number and list, but stay on the domain page marked "Hidden".
- **Reflect monthly** — for non-monthly cadences: the domain chart and forecast
  carry the item's monthly share every month instead of one annual spike, while
  the real payment still appears in the transactions list on its actual date.
- **Apply tags to each payment** / **apply the note to each payment** — the
  item's tags and note are copied onto the transactions it writes.

An item can be stopped, which deactivates it without destroying its history.

### Transaction (the ledger)

One dated row: domain, category, optional account, name, amount and currency,
optional payment method, tags and note, a date and a status (paid, pending or
skipped — skipping is how a single occurrence is deleted). If a recurring item
wrote it, the row remembers which one, which is how the interface can say
"recurring · Monthly · Netflix" and offer a jump to the rule.

A transaction can also record a **charged pair**: what the card was actually
debited, in a different currency, when it differs from the amount. A 15.49 USD
subscription billed as 62,700 COP stores both, and the conversion uses the rate
the user really paid. This belongs to single payments only — a recurring rule
cannot carry one, because the exchange rate differs every month.

### Value check

A point-in-time statement of what an investment account or savings pocket is
worth: a date, a gain percentage, a value and the cost basis at that moment,
all snapshotted so history stays truthful when rates change later. Between
checks, an account with a quoted interest rate is _estimated_ by compounding
each deposit monthly; a recorded check overrides the estimate from its date
forward.

### Service catalogue and exchange rates

A shared catalogue of known subscription services with per-country prices (used
to prefill during onboarding), and a daily cache of exchange rates.

### Rules that a designer will feel on screen

- Amounts never change once written. Totals are conversions, and any converted
  aggregate is marked with "≈".
- Nothing is hard-deleted. Categories, tags, methods and accounts archive;
  recurring items deactivate; transactions go to "skipped".
- A transaction's tags and note can diverge from its recurring item after a
  manual edit. Editing the item offers to rewrite its payments, which overwrites
  those manual edits.

---

## 3. Screens

Three screens are described here: the dashboard, the domain page (one page
shared by all four domains) and settings. Every screen sits in the same shell —
a left sidebar on desktop, a bottom tab bar on phones, and a header carrying
the page title, a one-line subtitle, the display-currency switcher and the
**month picker** ("September 2026", with previous/next arrows). The month is
app-wide: the dashboard and the domain pages all speak about the same month,
it survives navigation, and a link can carry it (`?month=2026-07`). A floating
"+" button is the single entry point for creating anything.

The sidebar lists **Dashboard**, then **Money** (Incomes, Expenses,
Investments, Savings), **Planning** (Prospect) and **Account** (Settings). The
phone tab bar shows Home, Incomes, Expenses and Invest, with the rest behind a
"More" sheet.

The interface is light by default — frosted "glass" cards over a soft mountain
backdrop — with a dark variant and a "system" setting that follows the OS.

---

### 3.1 Dashboard

**Purpose.** The monthly run-rate of the user's _plan_ (what the recurring
items add up to) next to what actually moved. Title: "Good morning, Guillermo"
(afternoon/evening after noon/six), subtitle "Here's your financial overview
for September 2026."

Down the page:

1. **Error banners** (conditional): data errors verbatim, and the
   exchange-rates-unavailable notice.
2. **Monthly plan hero**: the label "MONTHLY PLAN" with a "RECURRING" pill, the
   net figure ("left to allocate this month"), four mini stats (Income,
   Expenses, Investments, Savings) with an **allocation bar** splitting the
   month's income into expenses / investments / savings / left, and the quote
   _"A clear plan today, a more free tomorrow."_
3. **Four domain cards**, tinted in their colour, each with an icon, the name
   (linking to the domain page), the monthly figure, two top categories (amounts
   for income, shares for the rest), the per-currency mix when currencies are
   mixed, and "N categories" with a menu.
4. **Monthly cash flow**: per month, four bars side by side (one per domain),
   each stacked by its top five categories plus "Other" — or by currency, or
   plain — over the last 3, 6 or 12 months. Built from real transactions. A
   legend chip per domain opens the list of slices. Clicking a bar selects that
   month everywhere.
5. **Top expense categories** (icon, name, amount, bar, share; "View all") and
   **Upcoming payments** (calendar-leaf date, name, category, amount; "View
   all").
6. A dismissable **tip** at the foot of the page.

---

### 3.2 Domain page (Incomes · Expenses · Investments · Savings)

| Domain      | Title       | Subtitle                                                      | Accent |
| ----------- | ----------- | ------------------------------------------------------------- | ------ |
| Income      | Incomes     | See what comes in, month by month, and where it comes from.   | Green  |
| Expenses    | Expenses    | Track what you spend, see your patterns, and stay in control. | Red    |
| Investments | Investments | Follow what you put aside to grow, and what it is worth.      | Cyan   |
| Savings     | Savings     | Watch your pockets fill up, one deposit at a time.            | Amber  |

**Month summary** (two panels): **Total spent so far** — the figure, a delta
pill against the previous month ("↑ 12%", coloured by whether a rise is good
for the domain) and "Compared to SEK 16,402.18 in August 2026"; **Planned** —
the expected total, a progress bar, the percentage reached and "SEK 5,361.45
left" (or "Month total" for a finished month).

**Chart card** ("Monthly expenses · Actual expenses, split by category"): one
bar per month over the last 7 or 12 months, stacked by the **top five
categories + Other** in shades of the domain colour, or by **currency** (a
toggle). The dashed line is the six-month average; the current month carries a
hatched "still planned" segment; the selected month is highlighted and clicking
a bar selects it. A "Show hidden" checkbox appears when something is hidden.
Next to it, **Top categories** for the selected month (icon, name, amount, bar,
share; "View all" opens the Categories view).

**Views** (a segmented strip, remembered in the URL hash):

- **Transactions** — a table: DATE (sortable), DESCRIPTION (name, tag pills,
  note, "recurring · Monthly · Netflix" or "one-off"), CATEGORY (icon + name),
  METHOD (expenses only), AMOUNT (own currency, "charged …" when a pair was
  recorded), and a menu (Edit, Delete). Above it: a search box, a category
  filter and a method filter. On phones each row folds into a card. Capped at
  60 rows with "and N more".
- **Recurring** — the month's checklist in Overdue / Due / Paid groups, with
  "Not this month" collapsed underneath (unchanged).
- **Categories** — one row per root category (icon, name, count, share, planned,
  mini bar, total) with a drilldown into subcategory chips and that category's
  transactions table.
- **Tags** — the month grouped by tag (a payment with two tags counts under
  both); picking one narrows the Transactions view.
- **Payment methods** (expenses) — the month grouped by method; picking one
  narrows the Transactions view.
- **Value** (investments, savings) — accounts and pockets with their current
  value, gain and history (unchanged).

---

### 3.3 Settings

Title "Settings", subtitle "Manage your preferences, categories, tags, and
accounts." A section strip — **General · Categories · Tags · Payment methods ·
Accounts & pockets** — remembered in the URL hash.

**General** is six cards in two columns:

- **Account** — Name, Email, Password and Two-factor authentication rows (the
  last two link to the sign-in provider's account page when one is
  configured), "Edit profile", and Log out.
- **Currency** — Main currency ("Default for new entries."), Display currency
  ("Used for totals and conversions."), and the supported-currencies list.
- **Preferences** — Start week on, Date format (with a live example), Language
  (English), Theme (Light / Dark / System).
- **Setup** — Redo onboarding.
- **Data & privacy** — informational rows; export and deletion are not
  self-service yet and say so.
- **About** — Version, Built with, Help & support, Feedback.

**Categories** — per domain, each row with its icon; the menu offers Rename,
Change icon (a grid of 26 icons) and Archive. **Tags**, **Payment methods**
and **Accounts & pockets** keep their lists (25 per page).

---

## 4. Cross-cutting conventions

### Money

- Figures render in one locale for the whole interface: "$1,150.00",
  "COP 26,900", "kr 1,240.00". A row whose currency differs from the display
  currency is written with its ISO code.
- Chart axis ticks compact: "$60K", "COP 4M".
- "≈" prefixes a figure that was converted from at least one other currency.
- Net figures are coloured by sign; delta pills are coloured by whether the
  move is good for the domain (spending less is good, earning less is not).

### Dates

Every visible date follows the user's date-format preference (YYYY-MM-DD,
DD/MM/YYYY or MM/DD/YYYY); month labels ("Sep", "September 2026") never change.

### Pills

- **Solid** pills are states the app applied: "RECURRING", "Paid", "Due".
- **Outline** pills are the user's own tags, and the amber "Hidden".

### Colour

Two palettes chosen by a `data-theme` attribute. Light: page `#e9eef5` under
the backdrop, glass cards (white at 64%), text `#0f172a` / `#3b465a` /
`#6b7688`, primary accent blue `#2563eb`, domains green `#16a34a`, red
`#f43f5e`, cyan `#0ea5e9`, amber `#f59e0b`. Dark: the original noir values
(`#0a0a0f` page, `#14141b` cards, `#7cffb2` green, `#ff3d68` red, `#5ee8ff`
cyan, `#ffb84d` amber). Each domain also has a soft tint (card washes, icon
discs) and a six-step ramp for category-stacked bars. Corner radii are 6, 10,
16 and 20 pixels.

### States

Every list has three: **loading** ("Loading…"), **empty** written for that
list ("Nothing recorded in this period", "No tags yet", "Nothing matches these
filters"), and **error** showing the underlying message verbatim.
