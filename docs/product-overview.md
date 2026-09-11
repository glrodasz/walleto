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
a left sidebar on desktop, a bottom tab bar on phones, a header carrying the
page title and the display-currency switcher, and a floating "+" button.

The sidebar groups navigation as **Overview** (Dashboard), **Domains**
(Incomes, Expenses, Investments, Savings), **Plan** (Prospect) and **Manage**
(Methods, Settings). The phone tab bar shows only Home, Incomes, Expenses and
Invest, with everything else behind a "More" sheet.

---

### 3.1 Dashboard

**Purpose.** The monthly run-rate of the user's _plan_: what the recurring
items add up to each month, and what is left over. It is not a report of what
happened this month — that lives on the domain pages — and the interface says
so on every card.

Page title is personal: **"Welcome back, Guillermo"**.

Down the page:

**1. Error banners (conditional).** A data error shows the underlying message
verbatim, including any link it carries. A separate banner appears when
exchange rates cannot be fetched: _"Exchange rates unavailable — Totals mix
currencies without conversion right now. They'll correct themselves when rates
load again."_

**2. Net-flow hero (full width).**

| Element                             | Example                                                                                  |
| ----------------------------------- | ---------------------------------------------------------------------------------------- |
| Title, with a pill to its right     | "Net this month" · pill "Recurring"                                                      |
| The figure, large, coloured by sign | "≈ $2,480.00"                                                                            |
| Equation line                       | "$6,800.00 in − $2,120.00 out"                                                           |
| Allocation line                     | "→ savings $1,200.00 · investments $1,000.00"                                            |
| Footnote                            | "Your recurring plan per month. One-off payments show in Cash flow and Recent payments." |

**3. Four domain cards, in a row: Income, Expenses, Investments, Savings.**
Each card carries a 3px top border in its domain colour, and:

- The domain name with a **"Recurring"** pill at the top right.
- The monthly figure, large: "$2,120.00".
- Up to **two top categories** underneath: "Housing: $1,200.00 · Food: $420.00".
- A **per-currency share** line, shown only when more than one currency is in
  play: "USD 68% · SEK 32%".
- The Expenses card alone carries a **month-over-month delta**, measured on
  real transactions rather than the plan: "▲ 4.2% more than last month to
  date". Its colour reads the domain's sentiment — spending less is good,
  earning less is not.

**4. Cash flow (full width).** Titled "Cash flow" with the note _"Monthly
totals · this month is still in progress."_ Seven monthly bars, two series —
income green and expenses red — with the month in progress drawn lighter so a
half-finished month does not read as a collapse. **This block is built from
real transactions, unlike the cards above it.**

**5. Three cards in a row.**

- **"Expenses"** with a "View all" link. The top five categories plus an
  aggregated "Other" row. Each row: name, percentage, and a horizontal bar.
  Empty: "No data yet".
- **"Recent payments"**. Five transaction rows, each with the name, its amount
  in its own currency, and a relative date as metadata: "Today", "3 days ago".
  Empty: "No data yet".
- **"Next to expire"**. Five upcoming recurring items, each with the name, the
  amount and the next due date ("Oct 15"). A kebab menu offers "Mark as paid"
  and "Hide from dashboard". Empty: "No upcoming items".

**What a designer should know.** The dashboard's central tension is that the
big numbers are a _forecast_ and the chart below them is _history_, and they
will rarely agree. The "Recurring" pills are currently the only thing carrying
that distinction. Loading shows grey skeleton blocks sized to the final cards.

---

### 3.2 Domain page (Incomes · Expenses · Investments · Savings)

**Purpose.** One month of one domain, three ways: aggregated by category, as a
raw ledger, and as the plan's checklist. Investments and savings add a fourth
view for what the money is _worth_.

All four pages are the same layout with different copy and accent:

| Domain      | Title       | Month verb              | Accent |
| ----------- | ----------- | ----------------------- | ------ |
| Income      | Incomes     | "Received in September" | Green  |
| Expenses    | Expenses    | "Spent in September"    | Red    |
| Investments | Investments | "Invested in September" | Cyan   |
| Savings     | Savings     | "Saved in September"    | Amber  |

The page is a single column: the chart card on top, the tabbed section below it
at every width.

#### The chart card

**Month strip.** Seven chips, oldest to newest, horizontally scrollable, the
selected one highlighted and the current month marked. Selecting one changes
everything below.

**The month's verdict**, stacked:

- Label: "Spent in September **so far**" (the "so far" appears only for the
  month in progress).
- The figure, large: "≈ $1,240.00".
- A progress bar filling realised against expected.
- A sentence combining two facts:
  _"**$380.00** still planned · expected **$1,620.00** · 12% above your average
  of $1,450.00"_. For a finished month it reads "Month total" instead, and when
  the plan owes nothing: "Nothing more planned this month". The comparison
  clause is coloured by whether being above average is good for that domain.

**The bars.** Seven months. A dashed line marks the six-month average. The
current month carries a lighter segment on top of its bar representing what the
plan still owes. When more than one currency is in use the bars stack by
currency with a colour per currency and a legend; otherwise a single bar in the
domain accent.

**"Show hidden" checkbox**, appearing only when something is hidden:
_"Show hidden — items hidden from the dashboard and categories hidden from the
chart"_. Off by default, remembered per domain. It affects the bars and the
month figure only; the lists always show everything.

#### The tab strip

"Categories · Transactions · Recurring", plus "Value" for investments and
savings.

#### Categories view

One row per root category, sorted by size, with children folded in:

- Name, followed by an amber **"Hidden on chart"** pill when applicable.
- Metadata: "12 transactions · 34% · $300.00 planned".
- A thin progress bar of actual against expected.
- The total on the right: "$420.00".
- A chevron, and a kebab offering "Hide from chart" / "Show on chart".

Empty: "Nothing in this month yet".

**Drilldown.** Tapping a row replaces the list with: a "‹ All categories" back
link, a row of subcategory chips ("All" plus each child) when the category has
children, and the month's transactions for it under the heading "Household ·
September". For investments and savings, the value panels for the accounts
behind that category appear underneath. For the Expenses "Subscriptions"
category, a subscription cost-insight panel appears.

#### Transactions view

The ledger, newest first, **grouped by day**. Each day has a header with a
relative label and that day's subtotal: "Today — $47.50", "3 days ago —
$120.00".

Row anatomy, left to right:

| Part                               | Example                                                                                         |
| ---------------------------------- | ----------------------------------------------------------------------------------------------- |
| Name                               | "Netflix"                                                                                       |
| Pills after the name               | amber "Hidden"; neutral "Trip2026", "Work"                                                      |
| Note line, when present            | "Shared with Ana"                                                                               |
| Amount (right, top)                | "COP 62,700"                                                                                    |
| Charged amount, when different     | "charged $15.49"                                                                                |
| Metadata (right, under the amount) | "recurring · Monthly" or "recurring · Monthly · Netflix" when the row was renamed, or "one-off" |
| Kebab                              | "Edit", "Delete"                                                                                |

The list caps at 60 rows and closes with "and 14 more in this period". Empty:
"Nothing recorded in this period".

Editing a row opens the entry form, which — for a row a recurring item wrote —
shows a banner: _"Part of the recurring item **Netflix** · Monthly · next Oct
15"_ with an "Edit the recurring item" action that jumps to the rule.

#### Recurring view

The month's plan as a checklist, in three groups — **Overdue**, **Due**,
**Paid** — each with a group total on the right.

Row anatomy:

- Name, pills (amber "Hidden on dashboard", neutral tags), an optional note line.
- Metadata: "Sep 25 · Monthly · Housing · Chase ••4242 (Credit card)" — the
  date, the cadence, the category and the full payment method.
- The amount in its own currency.
- A status pill: "Overdue", "Due", "Paid".
- A kebab: "Mark as paid", "Edit", "Hide from dashboard", "Stop".

Below the groups, a collapsed fold: **"Not this month (3)"**, holding active
items that do not fall in the selected month, each showing its cadence and next
date ("Yearly · next Jan 15"). Empty: "No recurring expenses yet".

#### Value view (investments and savings only)

Titled "Value". One row per account or pocket, plus a single "No account" row
holding everything unfiled:

- Name, with an interest pill when the account quotes a rate: "SEB savings"
  · "2.5% yearly".
- Metadata: "SEB · In $1,000.00 · checked Sep 2", or "· estimated" when the
  figure comes from compounding interest, or "· no value check yet".
- The current value and the gain: "$1,024.00" and "+2.4%".
- A "Record value" button.

Selecting a row opens a panel beneath it: three figures (**Invested**, **Current
value** with its provenance underneath, **Gain** with a percentage), a
twelve-month two-line chart of invested against value, and the history of
recorded checks — each with its date, value, "+100.0% on $130.00" and an
optional note, with a kebab to edit or delete.

Empty: "Nothing here yet — file a deposit under a pocket to track its value".

**What a designer should know.** This is the densest screen in the app. A
recurring row can carry a name, two kinds of pill, a note, a four-part metadata
line, an amount, a status pill and a menu — and it must stay readable on a
phone. The metadata line is where the pressure is worst.

---

### 3.3 Settings

**Purpose.** Everything the user maintains rather than records: identity,
reporting currency, and the three lists that entries are filed against.

A section tab strip sits at the top — **General · Categories · Tags · Accounts
& pockets** — above a single column capped at a readable width. Only the
selected section is shown, and it is remembered in the URL, so a link can point
straight at one.

#### General

Three cards:

- **Account** — two label/value rows, "Name" and "Email", and a red "Log out"
  link.
- **Currency** — the hint _"Your main currency for reporting. Amounts always
  stay in the currency they were entered in — this only controls the default
  target for totals."_ and a narrow currency select.
- **Setup** — the hint _"Re-run the assisted setup to review your categories,
  payment methods, and recurring incomes and expenses."_ and a "Redo
  onboarding" button.

#### Categories

A four-tab strip in the domain accents — Incomes, Expenses, Investments,
Savings — over the root categories of the selected domain. Each row is the
name, a small "default" badge for seeded categories, and a kebab with "Rename"
and "Archive". Renaming swaps the row for an inline field with Save and Cancel.
Below the list, an "Add category" chip opens a combobox suggesting names not
already used. Empty: "No categories yet".

#### Tags

The hint _"Labels for any payment or recurring item. Spaces are dropped."_,
then one row per tag: the name and a kebab with "Rename" and "Archive". An
"Add tag" chip at the bottom. Renaming to a name that collides with another tag
is refused with the message _"You already have a tag called 'Trip2026'"_.
Empty: "No tags yet".

#### Accounts & pockets

A two-tab strip, Investments and Savings. Rows show the account's label —
"SEB - Savings", the bank or broker before the name — over metadata giving its
currency and rate: "SEK · 2.5% yearly". The kebab offers "Edit" and "Archive".
Editing expands the row into a form: Name, Bank or broker, Currency, Interest
rate % and Period (Yearly or Monthly); emptying the rate clears it. An "Add
pocket" / "Add account" chip opens the same creator used by the entry forms.
Empty: "No pockets yet".

**Long lists.** All three lists page at 25 rows, with "Previous · Page 2 of 5 ·
Next" underneath. Switching domain tabs returns to page one.

**What a designer should know.** These lists are the ones that grow without
limit — a user may end up with sixty tags. The current answer is pagination;
there is no search or filter, and no bulk action.

---

## 4. Cross-cutting conventions

### Money

- Figures render in one locale for the whole interface, so grouping is
  consistent: "$1,150.00", "COP 26,900", "kr 1,240.00". A row whose currency
  differs from the display currency is written with its ISO code rather than
  its symbol, because USD, MXN and COP all use "$".
- Chart axis ticks compact: "$60K", "COP 4M".
- "≈" prefixes a figure that was converted from at least one other currency.
- Net figures are coloured by sign: green at or above zero, red below.

### Pills and badges

Two distinct vocabularies, and they must stay distinguishable:

- **Amber outline** — a state the app applied: "Hidden", "Hidden on chart".
- **Neutral outline** — the user's own tags.
- **Filled status pills** — "Overdue", "Due", "Paid" in the recurring
  checklist.

### Colour tokens

Dark interface throughout.

| Role                      | Token     |
| ------------------------- | --------- |
| Page background           | `#0a0a0f` |
| Card surface              | `#14141b` |
| Input / raised surface    | `#1c1c26` |
| Hairline border           | `#2a2a38` |
| Primary text              | `#f5f5fa` |
| Secondary text            | `#b8b8c8` |
| Muted text, metadata      | `#6e6e85` |
| Green (income, positive)  | `#7cffb2` |
| Red (expense, negative)   | `#ff3d68` |
| Amber (savings, warnings) | `#ffb84d` |
| Cyan (investments)        | `#5ee8ff` |

Cards carry a 3px top border in their domain accent. Corner radii are 6, 10 and
16 pixels. An eight-colour categorical palette exists for per-currency stacked
bars, in a fixed order so a currency keeps its colour across pages.

### States

Every list has three: a **loading** line ("Loading…"), an **empty** line
written for that specific list ("Nothing recorded in this period", "No tags
yet"), and an **error** state that shows the underlying message verbatim rather
than a friendly euphemism — a deliberate choice after a silent failure once
made screens look empty instead of broken.

### Layout

A left sidebar on desktop, a fixed bottom nav on phones, and a floating "+"
button on every screen at every width — the single entry point for creating
anything. Inputs are 40px tall on desktop and 44px on phones, with 16px text to
stop iOS zooming on focus.
