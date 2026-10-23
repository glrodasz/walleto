import { defineMessages } from "../../helpers/i18n";

/**
 * The public landing page: what someone gets with Walleto. Every claim here
 * has to be true of the app today — no pricing, no bank sync, no export
 * button — so the page never promises what isn't built. The `art.*` strings
 * are the labels inside the vector illustrations.
 */
export const LANDING_MESSAGES = defineMessages(
  {
    "meta.title": "Walleto · Personal finance planner, month by month",
    "meta.description":
      "Plan your income, expenses, savings, investments and debts. See whether the month is on plan and what you're worth today, in every currency you use.",

    "nav.skip": "Skip to content",
    "nav.signIn": "Sign in",
    "nav.openApp": "Open Walleto",

    "hero.eyebrow": "Personal finance planner",
    // Non-breaking spaces keep the closing phrase on one line.
    "hero.title": "Your money plan, month by month.",
    "hero.subtitle": "Plan every month and see how you're doing, in any currency.",
    "hero.secondary": "See how it works",
    "hero.trust.bank": "No bank connection",
    "hero.trust.currencies": "8 currencies",
    "hero.trust.languages": "Multilingual",
    "hero.art":
      "Illustration of Walleto: what's left to allocate this month, and the month's payments on a phone.",

    "problem.eyebrow": "The problem",
    "problem.title": "Most money apps tell you what happened.",
    "problem.titleMuted": "Not whether you're on track.",
    "problem.1.title": "Tracking isn't planning",
    "problem.1.body":
      "A list of last month's spending says nothing about this one. Walleto starts from the plan.",
    "problem.2.title": "Saving isn't spending",
    "problem.2.body":
      "Money you save or invest is still yours. Walleto counts it apart, so what's left over is real.",
    "problem.3.title": "Life happens in more than one currency",
    "problem.3.body":
      "Paid in dollars, rent in pesos, a subscription in euros. Every amount keeps its own currency.",

    "how.eyebrow": "How it works",
    "how.title": "Three steps to a plan you trust.",
    "how.1.title": "Set up your plan in minutes",
    "how.1.body": "A guided setup suggests categories and subscriptions with local prices.",
    "how.2.title": "Walleto keeps the ledger",
    "how.2.body": "Recurring payments log themselves. You only touch what changed.",
    "how.3.title": "Decide with real numbers",
    "how.3.body": "See what's left, what's due and how long your savings last.",

    "features.eyebrow": "What you get",
    "features.title": "Everything a monthly plan needs.",
    "features.plan.eyebrow": "Monthly plan",
    "features.plan.title": "Know what's left to allocate",
    "features.plan.body":
      "Income minus expenses, savings, investments and debt payments. One number for what's still unassigned, with an On plan or Over-committed verdict.",
    "features.checklist.eyebrow": "Plan vs. paid",
    "features.checklist.title": "This month, as a checklist",
    "features.checklist.body":
      "Every planned payment is Overdue, Due or Paid. If it came in at a different amount or on another day, you see both.",
    "features.variable.eyebrow": "Variable expenses",
    "features.variable.title": "Bills that never cost the same",
    "features.variable.body":
      "Give electricity or groceries a floor and a ceiling. Switch between best, average and worst case.",
    "features.currency.eyebrow": "Multi-currency",
    "features.currency.title": "Every currency, one total",
    "features.currency.body":
      "USD, EUR, MXN, GBP, SEK, CHF, JPY and COP. Each amount keeps its original currency; totals convert and are marked with ≈.",
    "features.worth.eyebrow": "Net worth",
    "features.worth.title": "What you're worth, today",
    "features.worth.body":
      "Investments plus savings minus what you still owe. Update an account's value now and then, and Walleto works out the gain.",
    "features.prospect.eyebrow": "Simulator",
    "features.prospect.title": "If your income stopped today",
    "features.prospect.body":
      "Emergency mode shows how many months your savings would last. What-if shows what cancelling subscriptions would free up.",

    "extras.eyebrow": "Details",
    "extras.title": "And the details that make it yours.",
    "extras.organize.title": "Organise your way",
    "extras.organize.body": "Categories, tags and payment methods.",
    "extras.privacy.title": "Privacy mode",
    "extras.privacy.body": "Hides every amount behind ****.",
    "extras.theme.title": "Light and dark",
    "extras.theme.body": "A calm light theme and a neon dark one.",
    "extras.language.title": "English and Spanish",
    "extras.language.body": "With your own date and number formats.",

    "trust.eyebrow": "Privacy",
    "trust.title": "Your numbers stay yours.",
    "trust.bank.title": "We never connect to your bank",
    "trust.bank.body": "Every figure is one you typed in.",
    "trust.ads.title": "No ads, no selling data",
    "trust.ads.body": "Your information is used only to run Walleto.",
    "trust.auth.title": "Secure sign-in",
    "trust.auth.body": "Auth0 sign-in, data encrypted and stored in Google Cloud.",
    "trust.policy": "Read the privacy policy",

    "source.title": "Built in the open",
    "source.body": "Walleto's code is public. Read how every number is calculated.",
    "source.cta": "View on GitHub",

    "faq.title": "Questions",
    "faq.bank.q": "Does it connect to my bank?",
    "faq.bank.a":
      "No. You type every figure yourself, and recurring payments are logged automatically. No third party ever holds your bank credentials.",
    "faq.currencies.q": "Which currencies does it support?",
    "faq.currencies.a":
      "USD, EUR, MXN, GBP, SEK, CHF, JPY and COP. Amounts keep their original currency; totals convert into the one you pick.",
    "faq.phone.q": "Does it work on my phone?",
    "faq.phone.a": "Yes. Walleto works in your phone's browser as well as on desktop.",
    "faq.tracker.q": "How is it different from an expense tracker?",
    "faq.tracker.a":
      "An expense tracker looks back. Walleto starts from your plan, counts savings, investments and debts on their own, and tells you whether this month is on track.",
    "faq.data.q": "Can I delete my data?",
    "faq.data.a":
      "Yes. Write to us from the privacy policy and we'll delete your account and its data.",

    "final.title": "Set up your plan today.",
    "final.body": "It takes a few minutes, and you can change everything later.",

    "footer.nav": "Footer",
    "footer.privacy": "Privacy",
    "footer.source": "Source code",
    "footer.contact": "Contact",
    "footer.tagline": "A clear plan today, a freer tomorrow.",

    "art.greeting": "Good morning, Ada",
    "art.month": "October 2026 · on plan",
    "art.leftToAllocate": "Left to allocate",
    "art.income": "Income",
    "art.expenses": "Expenses",
    "art.invest": "Invest",
    "art.debts": "Debts",
    "art.thisMonth": "This month",
    "art.netWorthToday": "Net worth today",
    "art.netWorthAsOf": "Net worth, as of today",
    "art.investments": "Investments",
    "art.savings": "Savings",
    "art.paid": "Paid",
    "art.due": "Due",
    "art.overdue": "Overdue",
    "art.rent": "Rent",
    "art.electricity": "Electricity",
    "art.groceries": "Groceries",
    "art.fuel": "Fuel",
    "art.carLoan": "Car loan",
    "art.internet": "Internet",
    "art.gym": "Gym",
    "art.phone": "Phone",
    "art.paidDifferent": "paid $49 on the 4th",
    "art.octoberBudget": "October plan",
    "art.left": "left",
    "art.best": "Best",
    "art.average": "Average",
    "art.worst": "Worst",
    "art.freelance": "Freelance",
    "art.total": "Total",
    "art.emergency": "Emergency mode",
    "art.runway": "months of runway",
    "art.whatIf": "What-if: cancel 3 subscriptions",
  },
  {
    "meta.title": "Walleto · Planificador de finanzas personales, mes a mes",
    "meta.description":
      "Planea tus ingresos, gastos, ahorros, inversiones y deudas. Mira si el mes va según el plan y cuánto vales hoy, en todas tus monedas.",

    "nav.skip": "Saltar al contenido",
    "nav.signIn": "Entrar",
    "nav.openApp": "Abrir Walleto",

    "hero.eyebrow": "Planificador de finanzas personales",
    "hero.title": "Tu plan de dinero, mes a mes.",
    "hero.subtitle": "Planea cada mes y mira cómo vas, en cualquier moneda.",
    "hero.secondary": "Mira cómo funciona",
    "hero.trust.bank": "Sin conectar tu banco",
    "hero.trust.currencies": "8 monedas",
    "hero.trust.languages": "Multilingüe",
    "hero.art":
      "Ilustración de Walleto: lo que te queda por asignar este mes y los pagos del mes en un teléfono.",

    "problem.eyebrow": "El problema",
    "problem.title": "Casi todas las apps te dicen qué pasó.",
    "problem.titleMuted": "No si vas bien.",
    "problem.1.title": "Registrar no es planear",
    "problem.1.body":
      "La lista de lo que gastaste el mes pasado no dice nada de este. Walleto parte del plan.",
    "problem.2.title": "Ahorrar no es gastar",
    "problem.2.body":
      "Lo que ahorras o inviertes sigue siendo tuyo. Walleto lo cuenta aparte, así lo que te queda es real.",
    "problem.3.title": "Tu vida está en más de una moneda",
    "problem.3.body":
      "Cobras en dólares, pagas el arriendo en pesos y una suscripción en euros. Cada monto guarda su moneda.",

    "how.eyebrow": "Cómo funciona",
    "how.title": "Tres pasos para un plan en el que confías.",
    "how.1.title": "Arma tu plan en minutos",
    "how.1.body":
      "Una configuración guiada te sugiere categorías y suscripciones con precios locales.",
    "how.2.title": "Walleto lleva el registro",
    "how.2.body": "Los pagos recurrentes se anotan solos. Tú solo tocas lo que cambió.",
    "how.3.title": "Decide con números reales",
    "how.3.body": "Mira cuánto te queda, qué vence y cuánto dura tu colchón.",

    "features.eyebrow": "Lo que obtienes",
    "features.title": "Todo lo que necesita un plan mensual.",
    "features.plan.eyebrow": "Plan mensual",
    "features.plan.title": "Sabe cuánto te queda por asignar",
    "features.plan.body":
      "Ingresos menos gastos, ahorros, inversiones y pagos de deudas. Un número para lo que aún no tiene destino, con el veredicto Dentro del plan o Sobrecomprometido.",
    "features.checklist.eyebrow": "Plan vs. pagado",
    "features.checklist.title": "Este mes, como una lista",
    "features.checklist.body":
      "Cada pago planeado está Vencido, Pendiente o Pagado. Si pagaste otro monto u otro día, ves las dos cosas.",
    "features.variable.eyebrow": "Gastos variables",
    "features.variable.title": "Cuentas que nunca cuestan lo mismo",
    "features.variable.body":
      "Dale a la luz o al mercado un piso y un techo. Cambia entre el mejor caso, el promedio y el peor.",
    "features.currency.eyebrow": "Multimoneda",
    "features.currency.title": "Todas tus monedas, un solo total",
    "features.currency.body":
      "USD, EUR, MXN, GBP, SEK, CHF, JPY y COP. Cada monto guarda su moneda; los totales se convierten y se marcan con ≈.",
    "features.worth.eyebrow": "Patrimonio",
    "features.worth.title": "Cuánto vales, hoy",
    "features.worth.body":
      "Inversiones más ahorros menos lo que aún debes. Actualiza el valor de una cuenta de vez en cuando y Walleto calcula la ganancia.",
    "features.prospect.eyebrow": "Simulador",
    "features.prospect.title": "Si tus ingresos pararan hoy",
    "features.prospect.body":
      "El modo emergencia te muestra cuántos meses dura tu colchón. Escenarios te muestra cuánto liberas si cancelas suscripciones.",

    "extras.eyebrow": "Detalles",
    "extras.title": "Y los detalles que lo hacen tuyo.",
    "extras.organize.title": "Organiza a tu manera",
    "extras.organize.body": "Categorías, etiquetas y métodos de pago.",
    "extras.privacy.title": "Modo privacidad",
    "extras.privacy.body": "Oculta todos los montos tras ****.",
    "extras.theme.title": "Claro y oscuro",
    "extras.theme.body": "Un tema claro y tranquilo, y uno oscuro neón.",
    "extras.language.title": "Español e inglés",
    "extras.language.body": "Con tu propio formato de fechas y números.",

    "trust.eyebrow": "Privacidad",
    "trust.title": "Tus números son tuyos.",
    "trust.bank.title": "Nunca nos conectamos a tu banco",
    "trust.bank.body": "Cada cifra la escribes tú.",
    "trust.ads.title": "Sin anuncios, sin vender datos",
    "trust.ads.body": "Tu información se usa solo para que Walleto funcione.",
    "trust.auth.title": "Inicio de sesión seguro",
    "trust.auth.body": "Con Auth0; los datos van cifrados y se guardan en Google Cloud.",
    "trust.policy": "Lee la política de privacidad",

    "source.title": "Hecho a la vista",
    "source.body": "El código de Walleto es público. Revisa cómo se calcula cada número.",
    "source.cta": "Ver en GitHub",

    "faq.title": "Preguntas",
    "faq.bank.q": "¿Se conecta con mi banco?",
    "faq.bank.a":
      "No. Tú escribes cada cifra y los pagos recurrentes se anotan solos. Ningún tercero guarda tus claves del banco.",
    "faq.currencies.q": "¿Qué monedas soporta?",
    "faq.currencies.a":
      "USD, EUR, MXN, GBP, SEK, CHF, JPY y COP. Cada monto guarda su moneda; los totales se convierten a la que elijas.",
    "faq.phone.q": "¿Funciona en el teléfono?",
    "faq.phone.a": "Sí. Walleto funciona en el navegador del teléfono y en el computador.",
    "faq.tracker.q": "¿En qué se diferencia de una app de gastos?",
    "faq.tracker.a":
      "Una app de gastos mira hacia atrás. Walleto parte de tu plan, cuenta los ahorros, las inversiones y las deudas por separado, y te dice si este mes va bien.",
    "faq.data.q": "¿Puedo borrar mis datos?",
    "faq.data.a":
      "Sí. Escríbenos desde la política de privacidad y borramos tu cuenta y sus datos.",

    "final.title": "Arma tu plan hoy.",
    "final.body": "Toma unos minutos, y puedes cambiar todo después.",

    "footer.nav": "Pie de página",
    "footer.privacy": "Privacidad",
    "footer.source": "Código fuente",
    "footer.contact": "Contacto",
    "footer.tagline": "Un plan claro hoy, un mañana más libre.",

    "art.greeting": "Buenos días, Ada",
    "art.month": "Octubre 2026 · dentro del plan",
    "art.leftToAllocate": "Por asignar",
    "art.income": "Ingresos",
    "art.expenses": "Gastos",
    "art.invest": "Inversión",
    "art.debts": "Deudas",
    "art.thisMonth": "Este mes",
    "art.netWorthToday": "Patrimonio hoy",
    "art.netWorthAsOf": "Patrimonio, a hoy",
    "art.investments": "Inversiones",
    "art.savings": "Ahorros",
    "art.paid": "Pagado",
    "art.due": "Pendiente",
    "art.overdue": "Vencido",
    "art.rent": "Arriendo",
    "art.electricity": "Luz",
    "art.groceries": "Mercado",
    "art.fuel": "Gasolina",
    "art.carLoan": "Crédito del carro",
    "art.internet": "Internet",
    "art.gym": "Gimnasio",
    "art.phone": "Celular",
    "art.paidDifferent": "pagaste $49 el 4",
    "art.octoberBudget": "Plan de octubre",
    "art.left": "libre",
    "art.best": "Mejor",
    "art.average": "Promedio",
    "art.worst": "Peor",
    "art.freelance": "Freelance",
    "art.total": "Total",
    "art.emergency": "Modo emergencia",
    "art.runway": "meses de colchón",
    "art.whatIf": "Escenario: cancela 3 suscripciones",
  }
);
