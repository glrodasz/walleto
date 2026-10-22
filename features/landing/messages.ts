import { defineMessages } from "../../helpers/i18n";

/**
 * The public landing page: what someone gets when they create an account.
 * Every claim here has to be true of the app today — no pricing, no bank
 * sync, no export button — so the page never promises what isn't built.
 */
export const LANDING_MESSAGES = defineMessages(
  {
    "meta.title": "Walleto · Your money plan, month by month",
    "meta.description":
      "Plan your income, expenses, savings, investments and debts. See whether the month is on plan and what you're worth today, in every currency you use.",

    "nav.signIn": "Sign in",
    "nav.openApp": "Open Walleto",
    "nav.language": "Language",

    "hero.eyebrow": "Personal finance planner",
    // Non-breaking spaces keep the closing phrase on one line.
    "hero.title": "Your money plan, month\u00a0by\u00a0month.",
    "hero.subtitle": "Plan every month and see how you're doing, in any currency.",
    "hero.secondary": "See how it works",
    "hero.trust.bank": "No bank connection",
    "hero.trust.currencies": "8 currencies",
    "hero.trust.languages": "English and Spanish",
    "hero.shot": "The Walleto dashboard: the monthly plan, net worth today and a card per domain.",
    "hero.shotMobile": "The same dashboard on a phone.",

    "problem.title": "Most money apps tell you what happened. Not whether you're on track.",
    "problem.1.title": "Tracking isn't planning",
    "problem.1.body":
      "A list of last month's spending says nothing about this month. Walleto starts from the plan and measures the month against it.",
    "problem.2.title": "Saving isn't spending",
    "problem.2.body":
      "Money you save or invest is still yours, but it isn't free to spend either. Walleto counts it apart, so the number left over is real.",
    "problem.3.title": "Life happens in more than one currency",
    "problem.3.body":
      "Paid in dollars, rent in pesos, a subscription in euros. Every amount keeps its own currency and the totals convert for you.",

    "how.title": "How it works",
    "how.1.title": "Set up your plan in minutes",
    "how.1.body":
      "A guided setup suggests categories and well-known subscriptions with local prices. Add what you earn and pay each month.",
    "how.2.title": "Walleto keeps the ledger",
    "how.2.body":
      "Recurring payments write themselves into your activity as they come due. You only log the one-offs.",
    "how.3.title": "Decide with real numbers",
    "how.3.body":
      "See whether the month is on plan, what you're worth today, and what changes if you cut something.",

    "features.title": "What you get with an account",
    "features.plan.eyebrow": "Monthly plan",
    "features.plan.title": "Know what's left to allocate",
    "features.plan.body":
      "Income minus expenses, savings, investments and debt repayments. One number for what's left each month, with an On plan or Over-committed verdict.",
    "features.plan.shot": "The monthly plan card with its verdict and the five domains.",
    "features.checklist.eyebrow": "Plan vs. paid",
    "features.checklist.title": "This month, as a checklist",
    "features.checklist.body":
      "Every planned payment is Overdue, Due or Paid. When you paid a different amount or on another day, you see both without losing the plan.",
    "features.checklist.shot": "The month's plan grouped into overdue, due and paid.",
    "features.variable.eyebrow": "Variable expenses",
    "features.variable.title": "Bills that never cost the same",
    "features.variable.body":
      "Give electricity or groceries a floor and a ceiling. Switch between best, average and worst case, and confirm the real amount when the month closes.",
    "features.variable.shot": "Variable expenses with their range and the scenario picker.",
    "features.currency.eyebrow": "Multi-currency",
    "features.currency.title": "Every currency, one total",
    "features.currency.body":
      "USD, EUR, MXN, GBP, SEK, CHF, JPY and COP. Each row keeps the currency it was paid in; totals convert at today's rate and say so with ≈.",
    "features.currency.shot": "The activity list with amounts in several currencies.",
    "features.worth.eyebrow": "Net worth",
    "features.worth.title": "What you're worth, today",
    "features.worth.body":
      "Investments plus savings minus what you still owe. Update an account's value now and then, and Walleto works out the gain, and the interest on your debts.",
    "features.worth.shot": "Investment accounts with their current value and gain.",
    "features.prospect.eyebrow": "Simulator",
    "features.prospect.title": "If your income stopped today",
    "features.prospect.body":
      "Emergency mode shows how many months your cushion lasts. What-if lets you tick off subscriptions and see what you'd free each month and each year.",
    "features.prospect.shot": "Emergency mode: how long the cushion lasts.",

    "extras.title": "And the details that make it yours",
    "extras.organize.title": "Organise your way",
    "extras.organize.body": "Categories with subcategories, tags across domains, payment methods.",
    "extras.privacy.title": "Privacy mode",
    "extras.privacy.body":
      "One tap hides every amount behind ****, for when someone looks over your shoulder.",
    "extras.theme.title": "Light and dark",
    "extras.theme.body":
      "Glass over a landscape by day, a darker palette by night, or follow your device.",
    "extras.language.title": "English and Spanish",
    "extras.language.body":
      "Plus your own date format, decimal separator and first day of the week.",

    "trust.title": "Your numbers stay yours",
    "trust.bank.title": "We never connect to your bank",
    "trust.bank.body":
      "Every figure is one you typed in. No bank credentials, no aggregator reading your statements.",
    "trust.ads.title": "No ads, no selling data",
    "trust.ads.body": "Your information is used only to run Walleto.",
    "trust.auth.title": "Secure sign-in",
    "trust.auth.body":
      "Sign-in is handled by Auth0, so Walleto never sees your password. Data travels encrypted and is stored in Google Cloud.",
    "trust.policy": "Read the privacy policy",

    "source.title": "Built in the open",
    "source.body":
      "Walleto's code is public. Read how every number is calculated, report an issue, or suggest an improvement.",
    "source.cta": "View on GitHub",

    "faq.title": "Questions",
    "faq.bank.q": "Does it connect to my bank?",
    "faq.bank.a":
      "No. You enter your plan and Walleto writes the recurring payments for you. It's less automatic than a bank feed, and it means no third party ever holds your bank credentials.",
    "faq.currencies.q": "Which currencies does it support?",
    "faq.currencies.a":
      "US dollar, euro, Mexican peso, pound sterling, Swedish krona, Swiss franc, Japanese yen and Colombian peso. You pick a display currency and every total converts into it.",
    "faq.phone.q": "Does it work on my phone?",
    "faq.phone.a":
      "Yes. Walleto is a web app designed for phones and desktops alike, with a bottom tab bar on small screens.",
    "faq.tracker.q": "How is it different from an expense tracker?",
    "faq.tracker.a":
      "An expense tracker looks back. Walleto starts from your plan, counts savings, investments and debts on their own, and tells you whether this month is on track.",
    "faq.data.q": "Can I delete my data?",
    "faq.data.a":
      "Yes. Write to us from the privacy policy and we'll delete your account and everything in it.",

    "final.title": "Set up your plan today.",
    "final.body": "It takes a few minutes, and you can change everything later.",

    "footer.privacy": "Privacy",
    "footer.source": "Source code",
    "footer.contact": "Contact",
    "footer.tagline": "A clear plan today, a freer tomorrow.",
  },
  {
    "meta.title": "Walleto · Tu plan de dinero, mes a mes",
    "meta.description":
      "Planea tus ingresos, gastos, ahorros, inversiones y deudas. Mira si el mes va según el plan y cuánto vales hoy, en todas tus monedas.",

    "nav.signIn": "Entrar",
    "nav.openApp": "Abrir Walleto",
    "nav.language": "Idioma",

    "hero.eyebrow": "Planificador de finanzas personales",
    "hero.title": "Tu plan de dinero, mes\u00a0a\u00a0mes.",
    "hero.subtitle": "Planea cada mes y mira cómo vas, en cualquier moneda.",
    "hero.secondary": "Mira cómo funciona",
    "hero.trust.bank": "Sin conectar tu banco",
    "hero.trust.currencies": "8 monedas",
    "hero.trust.languages": "Español e inglés",
    "hero.shot":
      "El inicio de Walleto: el plan mensual, el patrimonio de hoy y una tarjeta por dominio.",
    "hero.shotMobile": "El mismo inicio en el teléfono.",

    "problem.title": "Casi todas las apps te dicen qué pasó. No si vas bien.",
    "problem.1.title": "Registrar no es planear",
    "problem.1.body":
      "La lista de lo que gastaste el mes pasado no dice nada de este mes. Walleto parte del plan y mide el mes contra él.",
    "problem.2.title": "Ahorrar no es gastar",
    "problem.2.body":
      "Lo que ahorras o inviertes sigue siendo tuyo, pero tampoco está libre para gastar. Walleto lo cuenta aparte, así lo que te queda es real.",
    "problem.3.title": "Tu vida está en más de una moneda",
    "problem.3.body":
      "Cobras en dólares, pagas el arriendo en pesos y una suscripción en euros. Cada monto guarda su moneda y los totales se convierten solos.",

    "how.title": "Cómo funciona",
    "how.1.title": "Arma tu plan en minutos",
    "how.1.body":
      "Una configuración guiada te sugiere categorías y suscripciones conocidas con precios locales. Agrega lo que ganas y pagas cada mes.",
    "how.2.title": "Walleto lleva el registro",
    "how.2.body":
      "Los pagos recurrentes se anotan solos en tu actividad cuando vencen. Tú solo registras lo puntual.",
    "how.3.title": "Decide con números reales",
    "how.3.body":
      "Mira si el mes va según el plan, cuánto vales hoy y qué cambia si recortas algo.",

    "features.title": "Lo que obtienes con tu cuenta",
    "features.plan.eyebrow": "Plan mensual",
    "features.plan.title": "Sabe cuánto te queda por asignar",
    "features.plan.body":
      "Ingresos menos gastos, ahorros, inversiones y pagos de deudas. Un número para lo que te queda cada mes, con el veredicto Dentro del plan o Sobrecomprometido.",
    "features.plan.shot": "La tarjeta del plan mensual con su veredicto y los cinco dominios.",
    "features.checklist.eyebrow": "Plan vs. pagado",
    "features.checklist.title": "Este mes, como una lista",
    "features.checklist.body":
      "Cada pago planeado está Vencido, Pendiente o Pagado. Si pagaste otro monto u otro día, ves las dos cosas sin perder el plan.",
    "features.checklist.shot": "El plan del mes agrupado en vencidos, pendientes y pagados.",
    "features.variable.eyebrow": "Gastos variables",
    "features.variable.title": "Cuentas que nunca cuestan lo mismo",
    "features.variable.body":
      "Dale a la luz o al mercado un piso y un techo. Cambia entre el mejor caso, el promedio y el peor, y confirma el monto real cuando cierra el mes.",
    "features.variable.shot": "Gastos variables con su rango y el selector de escenario.",
    "features.currency.eyebrow": "Multimoneda",
    "features.currency.title": "Todas tus monedas, un solo total",
    "features.currency.body":
      "USD, EUR, MXN, GBP, SEK, CHF, JPY y COP. Cada fila guarda la moneda en que se pagó; los totales se convierten a la tasa de hoy y lo marcan con ≈.",
    "features.currency.shot": "La actividad con montos en varias monedas.",
    "features.worth.eyebrow": "Patrimonio",
    "features.worth.title": "Cuánto vales, hoy",
    "features.worth.body":
      "Inversiones más ahorros menos lo que aún debes. Actualiza el valor de una cuenta de vez en cuando y Walleto calcula la ganancia, y los intereses de tus deudas.",
    "features.worth.shot": "Cuentas de inversión con su valor actual y su ganancia.",
    "features.prospect.eyebrow": "Simulador",
    "features.prospect.title": "Si tus ingresos pararan hoy",
    "features.prospect.body":
      "El modo emergencia te muestra cuántos meses dura tu colchón. Escenarios te deja marcar suscripciones y ver cuánto liberas al mes y al año.",
    "features.prospect.shot": "Modo emergencia: cuánto dura el colchón.",

    "extras.title": "Y los detalles que lo hacen tuyo",
    "extras.organize.title": "Organiza a tu manera",
    "extras.organize.body":
      "Categorías con subcategorías, etiquetas entre dominios, métodos de pago.",
    "extras.privacy.title": "Modo privacidad",
    "extras.privacy.body":
      "Un toque oculta todos los montos tras ****, para cuando alguien mira por encima del hombro.",
    "extras.theme.title": "Claro y oscuro",
    "extras.theme.body":
      "Vidrio sobre un paisaje de día, una paleta oscura de noche, o lo que diga tu dispositivo.",
    "extras.language.title": "Español e inglés",
    "extras.language.body":
      "Además, tu formato de fecha, separador decimal y primer día de la semana.",

    "trust.title": "Tus números son tuyos",
    "trust.bank.title": "Nunca nos conectamos a tu banco",
    "trust.bank.body":
      "Cada cifra la escribes tú. Sin claves del banco, sin agregadores leyendo tus extractos.",
    "trust.ads.title": "Sin anuncios, sin vender datos",
    "trust.ads.body": "Tu información se usa solo para que Walleto funcione.",
    "trust.auth.title": "Inicio de sesión seguro",
    "trust.auth.body":
      "El inicio de sesión lo maneja Auth0, así que Walleto nunca ve tu contraseña. Los datos viajan cifrados y se guardan en Google Cloud.",
    "trust.policy": "Lee la política de privacidad",

    "source.title": "Hecho a la vista",
    "source.body":
      "El código de Walleto es público. Revisa cómo se calcula cada número, reporta un problema o propón una mejora.",
    "source.cta": "Ver en GitHub",

    "faq.title": "Preguntas",
    "faq.bank.q": "¿Se conecta con mi banco?",
    "faq.bank.a":
      "No. Tú ingresas tu plan y Walleto anota los pagos recurrentes por ti. Es menos automático que leer el banco, y significa que ningún tercero guarda tus claves.",
    "faq.currencies.q": "¿Qué monedas soporta?",
    "faq.currencies.a":
      "Dólar estadounidense, euro, peso mexicano, libra esterlina, corona sueca, franco suizo, yen y peso colombiano. Eliges una moneda de visualización y todos los totales se convierten a ella.",
    "faq.phone.q": "¿Funciona en el teléfono?",
    "faq.phone.a":
      "Sí. Walleto es una app web pensada tanto para el teléfono como para el computador, con una barra de pestañas abajo en pantallas pequeñas.",
    "faq.tracker.q": "¿En qué se diferencia de una app de gastos?",
    "faq.tracker.a":
      "Una app de gastos mira hacia atrás. Walleto parte de tu plan, cuenta los ahorros, las inversiones y las deudas por separado, y te dice si este mes va bien.",
    "faq.data.q": "¿Puedo borrar mis datos?",
    "faq.data.a":
      "Sí. Escríbenos desde la política de privacidad y borramos tu cuenta con todo lo que tenga.",

    "final.title": "Arma tu plan hoy.",
    "final.body": "Toma unos minutos, y puedes cambiar todo después.",

    "footer.privacy": "Privacidad",
    "footer.source": "Código fuente",
    "footer.contact": "Contacto",
    "footer.tagline": "Un plan claro hoy, un mañana más libre.",
  }
);
