import { defineMessages } from "../../helpers/i18n";

/**
 * Onboarding copy: the intro slides, the steps, the wizard's chrome and every
 * step's own fields. Page-level copy (descriptions, save failures) lives with
 * the routes in `messages/pages.ts`.
 *
 * The add chips are one sentence per cadence and domain ("Add a monthly
 * expense"): Spanish word order and gender don't survive a "{cadence} {noun}".
 */
export const ONBOARDING_MESSAGES = defineMessages(
  {
    // ── Intro slides (`**…**` marks the bold phrases) ─────────────────────
    "slide.planner.label": "A planner, not a logbook",
    "slide.planner.title": "Walleto plans your month. It doesn't log every coffee.",
    "slide.planner.body":
      "No typing in **every purchase**. Walleto works from **what usually comes in and goes out**, and tells you whether the month is **on plan**.",
    "slide.clarity.label": "Step one: see it",
    "slide.clarity.title": "Better finances start with knowing where your money goes.",
    "slide.clarity.body":
      "Before cutting anything, get the picture: **what you earn**, and **where it goes** each month.",
    "slide.later.label": "No rush",
    "slide.later.title": "You don't have to set up everything today.",
    "slide.later.body":
      "Add **what you know now** and the rest **whenever you like**. You can change anything later, and run this setup again from **Settings › Setup**.",
    "slide.currencies.label": "Multi-currency by default",
    "slide.currencies.title": "Earn, spend and save in any currency.",
    "slide.currencies.body":
      "Paid in one currency, renting in another, saving in a third? Every amount **stays in its own currency**, and Walleto **converts only when it adds things up**.",
    "slide.income.label": "Start with the essentials",
    "slide.income.title": "Your main income comes first.",
    "slide.income.body":
      "Your **salary**, or whatever **reliably lands each month**. Side income can wait.",
    "slide.expenses.label": "Then the bills",
    "slide.expenses.title": "The bills you remember.",
    "slide.expenses.body": "Think **rent, utilities, the gym, Netflix**. The rest can wait.",
    "slide.worth.label": "After setup",
    "slide.worth.title": "The bigger picture comes later.",
    "slide.worth.body":
      "**Investments, savings and debts** aren't part of this setup. When you're ready, add them from their own pages and Walleto sums everything into your **net worth**.",

    // ── Scenes (decorative, but visible) ──────────────────────────────────
    "scene.bills": "Bills",
    "scene.bill.rent": "Rent",
    "scene.bill.utilities": "Utilities",
    "scene.bill.gym": "Gym",
    "scene.bill.netflix": "Netflix",
    "scene.addLater": "+ later",
    "scene.income": "Income",
    "scene.salary": "Salary",
    "scene.sideIncome": "+ side income",
    "scene.later": "Later",

    // ── Steps ─────────────────────────────────────────────────────────────
    "step.categories.label": "Categories",
    "step.categories.summary": "How your plan is sorted. Keep the defaults or add your own.",
    "step.methods.label": "Payment methods",
    "step.methods.summary": "The cards and accounts your bills are charged to.",
    "step.currencies.label": "Currencies",
    "step.currencies.summary": "The currency you plan in, and any others you use.",
    "step.incomes.label": "Income",
    "step.incomes.summary": "Your salary, or whatever lands each month.",
    "step.expenses.label": "Expenses",
    "step.expenses.summary": "Rent, utilities, subscriptions: the bills you remember.",
    "step.review.label": "Review",
    "step.review.summary": "Your plan as the dashboard will show it.",

    // ── Layout, Welcome and the wizard's footer ───────────────────────────
    "layout.title": "Build your plan",
    "layout.pageTitle": "{title} — Walleto",
    "layout.progress": "Setup progress",
    "welcome.title": "Welcome",
    "welcome.start": "Start setup",
    "overview.title": "What we'll set up",
    "overview.subtitle": "Six short steps. Skip any of them and come back later.",
    "later.skip": "Skip for now",
    "later.continue": "Continue later",
    "later.tipLabel": "How to finish setup later",
    "later.tip":
      "Everything you've saved stays. Run setup again anytime from Settings › Setup, or add categories, payment methods and plan items later on their own.",
    "later.failed": "Could not save your progress. Please try again.",

    // ── Categories ────────────────────────────────────────────────────────
    "categories.loadFailed": "Couldn't load your categories",
    "categories.add": "Add category",
    "categories.new.INCOME": "New income category",
    "categories.new.EXPENSE": "New expense category",
    "categories.new.INVESTMENT": "New investment category",
    "categories.new.SAVING": "New saving category",
    "categories.new.DEBT": "New debt category",

    // ── Payment methods ───────────────────────────────────────────────────
    "methods.addMore": "Add more",
    "methods.untitled": "Untitled",
    "methods.selectTypeFirst": "Select a type first",
    "methods.removeUnnamed": "Remove payment method",
    "methods.aliasRequired": "Every payment method needs an alias",

    // ── Currencies ────────────────────────────────────────────────────────
    "currencies.yours": "Your currency",
    "currencies.yoursHint":
      "Totals are shown in it and new entries start in it. The switcher in the header shows totals in another currency anytime.",
    "currencies.used": "Currencies you use",
    "currencies.turnOffLabel": "About turning off a currency",
    "currencies.turnOffTip":
      "Amounts already saved in a currency you turn off keep it — it just stops being offered for new ones.",
    "currencies.usedHint":
      "Turn on every currency you earn or pay in — these are the ones offered when you enter an amount.",
    "currencies.locked": "Your currency is always available.",

    // ── Income / Expenses ─────────────────────────────────────────────────
    "recurrent.backfill": "Backfill the history of recurring items",
    "recurrent.backfillHint":
      "The last 6 months, or longer for quarterly (1 year) and yearly (2 years) items, so your charts and totals have history from day one.",
    "recurrent.lessOften": "Less often",
    "recurrent.savedRowError":
      "Every saved item needs a category, a name and an amount — or remove it.",
    "row.mainCategory": "Main category",
    "row.cadence": "Cadence",
    "row.removeUnnamed": "Remove row",

    "cadence.monthly.title": "Every month",
    "cadence.monthly.hint": "Salary, rent, subscriptions — anything that lands every month.",
    "cadence.yearly.title": "Once a year",
    "cadence.yearly.hint": "Annual plans, insurance renewals, taxes.",
    "cadence.other.title": "Other cadence",
    "cadence.other.hint": "Weekly, twice a month or quarterly.",
    "cadence.oneTime.title": "One-time",
    "cadence.oneTime.hint": "A single payment on a specific date.",

    "add.monthly.INCOME.first": "Add a monthly income",
    "add.monthly.INCOME.more": "Add another monthly income",
    "add.monthly.EXPENSE.first": "Add a monthly expense",
    "add.monthly.EXPENSE.more": "Add another monthly expense",
    "add.monthly.OTHER.first": "Add a monthly item",
    "add.monthly.OTHER.more": "Add another monthly item",
    "add.yearly.INCOME.first": "Add a yearly income",
    "add.yearly.INCOME.more": "Add another yearly income",
    "add.yearly.EXPENSE.first": "Add a yearly expense",
    "add.yearly.EXPENSE.more": "Add another yearly expense",
    "add.yearly.OTHER.first": "Add a yearly item",
    "add.yearly.OTHER.more": "Add another yearly item",
    "add.other.INCOME.first": "Add an income on another cadence",
    "add.other.INCOME.more": "Add another income on another cadence",
    "add.other.EXPENSE.first": "Add an expense on another cadence",
    "add.other.EXPENSE.more": "Add another expense on another cadence",
    "add.other.OTHER.first": "Add an item on another cadence",
    "add.other.OTHER.more": "Add another item on another cadence",
    "add.oneTime.INCOME.first": "Add a one-time income",
    "add.oneTime.INCOME.more": "Add another one-time income",
    "add.oneTime.EXPENSE.first": "Add a one-time expense",
    "add.oneTime.EXPENSE.more": "Add another one-time expense",
    "add.oneTime.OTHER.first": "Add a one-time item",
    "add.oneTime.OTHER.more": "Add another one-time item",

    // ── Review ────────────────────────────────────────────────────────────
    "review.loadFailed": "Couldn't load your plan",
    "review.loading": "Loading your plan…",
    "review.title.INCOME": "Income in your plan",
    "review.title.EXPENSE": "Expenses in your plan",
    "review.empty.INCOME": "No income in your plan yet.",
    "review.empty.EXPENSE": "No expenses in your plan yet.",
    "review.summary": {
      one: "{count} item · {amount} a month",
      other: "{count} items · {amount} a month",
    },
    "review.perMonth": "≈ {amount} / month",
  },
  {
    "slide.planner.label": "Un planificador, no una bitácora",
    "slide.planner.title": "Walleto planea tu mes. No anota cada café.",
    "slide.planner.body":
      "No tienes que escribir **cada compra**. Walleto trabaja con **lo que suele entrar y salir**, y te dice si el mes va **según el plan**.",
    "slide.clarity.label": "Paso uno: verlo",
    "slide.clarity.title": "Unas mejores finanzas empiezan por saber a dónde va tu dinero.",
    "slide.clarity.body":
      "Antes de recortar nada, ten el panorama: **cuánto ganas** y **a dónde va** cada mes.",
    "slide.later.label": "Sin prisa",
    "slide.later.title": "No tienes que configurarlo todo hoy.",
    "slide.later.body":
      "Agrega **lo que sabes ahora** y el resto **cuando quieras**. Puedes cambiar cualquier cosa después y volver a hacer esta configuración desde **Ajustes › Configuración inicial**.",
    "slide.currencies.label": "Multimoneda de serie",
    "slide.currencies.title": "Gana, gasta y ahorra en cualquier moneda.",
    "slide.currencies.body":
      "¿Te pagan en una moneda, pagas arriendo en otra y ahorras en una tercera? Cada monto **se queda en su propia moneda**, y Walleto **convierte solo al sumar**.",
    "slide.income.label": "Empieza por lo esencial",
    "slide.income.title": "Primero, tu ingreso principal.",
    "slide.income.body":
      "Tu **salario**, o lo que **llega fijo cada mes**. Los ingresos extra pueden esperar.",
    "slide.expenses.label": "Luego, las facturas",
    "slide.expenses.title": "Las facturas que recuerdes.",
    "slide.expenses.body":
      "Piensa en **arriendo, servicios, el gimnasio, Netflix**. El resto puede esperar.",
    "slide.worth.label": "Después de la configuración",
    "slide.worth.title": "El panorama completo viene después.",
    "slide.worth.body":
      "**Inversiones, ahorros y deudas** no son parte de esta configuración. Cuando quieras, agrégalos desde sus propias páginas y Walleto lo suma todo en tu **patrimonio neto**.",

    "scene.bills": "Facturas",
    "scene.bill.rent": "Arriendo",
    "scene.bill.utilities": "Servicios",
    "scene.bill.gym": "Gimnasio",
    "scene.bill.netflix": "Netflix",
    "scene.addLater": "+ después",
    "scene.income": "Ingresos",
    "scene.salary": "Salario",
    "scene.sideIncome": "+ ingresos extra",
    "scene.later": "Después",

    "step.categories.label": "Categorías",
    "step.categories.summary": "Cómo se ordena tu plan. Usa las sugeridas o crea las tuyas.",
    "step.methods.label": "Medios de pago",
    "step.methods.summary": "Las tarjetas y cuentas a las que se cargan tus facturas.",
    "step.currencies.label": "Monedas",
    "step.currencies.summary": "La moneda en la que planeas y las demás que usas.",
    "step.incomes.label": "Ingresos",
    "step.incomes.summary": "Tu salario, o lo que te llegue cada mes.",
    "step.expenses.label": "Gastos",
    "step.expenses.summary": "Arriendo, servicios, suscripciones: lo que recuerdes.",
    "step.review.label": "Revisión",
    "step.review.summary": "Tu plan tal como lo mostrará Inicio.",

    "layout.title": "Arma tu plan",
    "layout.pageTitle": "{title} — Walleto",
    "layout.progress": "Progreso de la configuración",
    "welcome.title": "Bienvenida",
    "welcome.start": "Empezar",
    "overview.title": "Lo que vamos a configurar",
    "overview.subtitle": "Seis pasos cortos. Omite el que quieras y vuelve después.",
    "later.skip": "Omitir por ahora",
    "later.continue": "Seguir después",
    "later.tipLabel": "Cómo terminar la configuración después",
    "later.tip":
      "Todo lo que guardaste se conserva. Vuelve a hacer la configuración cuando quieras desde Ajustes › Configuración inicial, o agrega categorías, medios de pago y elementos del plan más adelante, por separado.",
    "later.failed": "No se pudo guardar tu progreso. Intenta de nuevo.",

    "categories.loadFailed": "No se pudieron cargar tus categorías",
    "categories.add": "Agregar categoría",
    "categories.new.INCOME": "Nueva categoría de ingresos",
    "categories.new.EXPENSE": "Nueva categoría de gastos",
    "categories.new.INVESTMENT": "Nueva categoría de inversiones",
    "categories.new.SAVING": "Nueva categoría de ahorros",
    "categories.new.DEBT": "Nueva categoría de deudas",

    "methods.addMore": "Agregar otro",
    "methods.untitled": "Sin nombre",
    "methods.selectTypeFirst": "Primero elige un tipo",
    "methods.removeUnnamed": "Quitar medio de pago",
    "methods.aliasRequired": "Cada medio de pago necesita un alias",

    "currencies.yours": "Tu moneda",
    "currencies.yoursHint":
      "Los totales se muestran en ella y los registros nuevos empiezan en ella. Con el selector del encabezado puedes ver los totales en otra moneda cuando quieras.",
    "currencies.used": "Monedas que usas",
    "currencies.turnOffLabel": "Sobre desactivar una moneda",
    "currencies.turnOffTip":
      "Los montos ya guardados en una moneda que desactivas la conservan; solo deja de ofrecerse para los nuevos.",
    "currencies.usedHint":
      "Activa cada moneda en la que ganas o pagas: son las que se ofrecen al ingresar un monto.",
    "currencies.locked": "Tu moneda siempre está disponible.",

    "recurrent.backfill": "Completar el historial de los elementos recurrentes",
    "recurrent.backfillHint":
      "Los últimos 6 meses, o más para los trimestrales (1 año) y los anuales (2 años), para que tus gráficos y totales tengan historial desde el primer día.",
    "recurrent.lessOften": "Menos frecuentes",
    "recurrent.savedRowError":
      "Cada elemento guardado necesita una categoría, un nombre y un monto, o quítalo.",
    "row.mainCategory": "Categoría principal",
    "row.cadence": "Frecuencia",
    "row.removeUnnamed": "Quitar fila",

    "cadence.monthly.title": "Cada mes",
    "cadence.monthly.hint": "Salario, arriendo, suscripciones: lo que llega cada mes.",
    "cadence.yearly.title": "Una vez al año",
    "cadence.yearly.hint": "Planes anuales, renovaciones de seguros, impuestos.",
    "cadence.other.title": "Otra frecuencia",
    "cadence.other.hint": "Semanal, quincenal o trimestral.",
    "cadence.oneTime.title": "Una sola vez",
    "cadence.oneTime.hint": "Un pago único en una fecha específica.",

    "add.monthly.INCOME.first": "Agregar un ingreso mensual",
    "add.monthly.INCOME.more": "Agregar otro ingreso mensual",
    "add.monthly.EXPENSE.first": "Agregar un gasto mensual",
    "add.monthly.EXPENSE.more": "Agregar otro gasto mensual",
    "add.monthly.OTHER.first": "Agregar un elemento mensual",
    "add.monthly.OTHER.more": "Agregar otro elemento mensual",
    "add.yearly.INCOME.first": "Agregar un ingreso anual",
    "add.yearly.INCOME.more": "Agregar otro ingreso anual",
    "add.yearly.EXPENSE.first": "Agregar un gasto anual",
    "add.yearly.EXPENSE.more": "Agregar otro gasto anual",
    "add.yearly.OTHER.first": "Agregar un elemento anual",
    "add.yearly.OTHER.more": "Agregar otro elemento anual",
    "add.other.INCOME.first": "Agregar un ingreso con otra frecuencia",
    "add.other.INCOME.more": "Agregar otro ingreso con otra frecuencia",
    "add.other.EXPENSE.first": "Agregar un gasto con otra frecuencia",
    "add.other.EXPENSE.more": "Agregar otro gasto con otra frecuencia",
    "add.other.OTHER.first": "Agregar un elemento con otra frecuencia",
    "add.other.OTHER.more": "Agregar otro elemento con otra frecuencia",
    "add.oneTime.INCOME.first": "Agregar un ingreso puntual",
    "add.oneTime.INCOME.more": "Agregar otro ingreso puntual",
    "add.oneTime.EXPENSE.first": "Agregar un gasto puntual",
    "add.oneTime.EXPENSE.more": "Agregar otro gasto puntual",
    "add.oneTime.OTHER.first": "Agregar un elemento puntual",
    "add.oneTime.OTHER.more": "Agregar otro elemento puntual",

    "review.loadFailed": "No se pudo cargar tu plan",
    "review.loading": "Cargando tu plan…",
    "review.title.INCOME": "Ingresos en tu plan",
    "review.title.EXPENSE": "Gastos en tu plan",
    "review.empty.INCOME": "Aún no hay ingresos en tu plan.",
    "review.empty.EXPENSE": "Aún no hay gastos en tu plan.",
    "review.summary": {
      one: "{count} elemento · {amount} al mes",
      other: "{count} elementos · {amount} al mes",
    },
    "review.perMonth": "≈ {amount} / mes",
  }
);
