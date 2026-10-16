import { defineMessages } from "../../helpers/i18n";

/** The dashboard: greeting, tip, net worth, the per-domain cards, cash flow and what's coming up. */
export const DASHBOARD_MESSAGES = defineMessages(
  {
    "title.named": "{greeting}, {name}",
    "title.anonymous": "{greeting}, there",
    subtitle: "Here's where your money stands in {month}.",

    "fx.title": "Exchange rates unavailable",
    "fx.description":
      "Totals mix currencies without conversion right now. They'll correct themselves when rates load again.",

    "tip.label": "Tip:",
    "tip.dismiss": "Dismiss tip",
    "tip.create":
      "Build your plan from the + button: add what repeats (rent, a salary, a subscription), and log one-offs as they happen.",

    "cards.caption": "planned per month",
    "topExpenses.title": "Top expense categories",
    "category.unknown": "Unknown",
    "category.other": "Other",

    "worth.title": "Net worth",
    "worth.today": "Today",
    "worth.empty":
      "Add your investment accounts, savings pockets and debts, then update what each is worth from the + button to see where you stand.",
    "worth.investments": "Investments",
    "worth.savings": "Savings",
    "worth.debts": "Owed on debts",
    "worth.sub": "What you own minus what you owe",
    "worth.sub.checked": "What you own minus what you owe · last checked {date}",
    "worth.sub.estimated": "What you own minus what you owe · partly estimated",
    "worth.sub.checkedEstimated":
      "What you own minus what you owe · last checked {date} · partly estimated",
    "worth.debtsUnknown":
      "A debt has no recorded balance yet, so it isn't counted. Update its balance to include it.",

    "cashFlow.title": "Monthly cash flow",
    "cashFlow.subtitle": "What actually happened, split by category.",
    "cashFlow.period": "Period",
    "cashFlow.lastMonths": "Last {count} months",
    "cashFlow.groupBy": "Group by",
    "cashFlow.groupBy.domain": "Group by domain",
    "cashFlow.groupBy.category": "Group by category",
    "cashFlow.groupBy.currency": "Group by currency",
    "cashFlow.legend": "Legend",
    "cashFlow.categories": { one: "{count} category", other: "{count} categories" },
    "cashFlow.currencies": { one: "{count} currency", other: "{count} currencies" },

    "upcoming.title": "Coming up in your plan",
    "upcoming.empty": "Nothing else coming up in your plan",
  },
  {
    "title.named": "{greeting}, {name}",
    "title.anonymous": "{greeting}",
    subtitle: "{month}: así va tu dinero.",

    "fx.title": "Tasas de cambio no disponibles",
    "fx.description":
      "Por ahora los totales suman monedas sin convertir. Se corregirán solos cuando vuelvan a cargar las tasas.",

    "tip.label": "Consejo:",
    "tip.dismiss": "Descartar consejo",
    "tip.create":
      "Arma tu plan desde el botón +: agrega lo que se repite (alquiler, un sueldo, una suscripción) y registra lo puntual cuando pase.",

    "cards.caption": "planeado por mes",
    "topExpenses.title": "Principales categorías de gasto",
    "category.unknown": "Desconocida",
    "category.other": "Otros",

    "worth.title": "Patrimonio",
    "worth.today": "Hoy",
    "worth.empty":
      "Agrega tus cuentas de inversión, bolsillos de ahorro y deudas, y luego actualiza su valor desde el botón + para ver dónde estás.",
    "worth.investments": "Inversiones",
    "worth.savings": "Ahorros",
    "worth.debts": "Adeudado",
    "worth.sub": "Lo que tienes menos lo que debes",
    "worth.sub.checked": "Lo que tienes menos lo que debes · revisado el {date}",
    "worth.sub.estimated": "Lo que tienes menos lo que debes · en parte estimado",
    "worth.sub.checkedEstimated":
      "Lo que tienes menos lo que debes · revisado el {date} · en parte estimado",
    "worth.debtsUnknown":
      "Una deuda aún no tiene saldo registrado, así que no se cuenta. Actualiza su saldo para incluirla.",

    "cashFlow.title": "Flujo de caja mensual",
    "cashFlow.subtitle": "Lo que de verdad pasó, por categoría.",
    "cashFlow.period": "Período",
    "cashFlow.lastMonths": "Últimos {count} meses",
    "cashFlow.groupBy": "Agrupar por",
    "cashFlow.groupBy.domain": "Por tipo",
    "cashFlow.groupBy.category": "Por categoría",
    "cashFlow.groupBy.currency": "Por moneda",
    "cashFlow.legend": "Leyenda",
    "cashFlow.categories": { one: "{count} categoría", other: "{count} categorías" },
    "cashFlow.currencies": { one: "{count} moneda", other: "{count} monedas" },

    "upcoming.title": "Lo que viene en tu plan",
    "upcoming.empty": "No viene nada más en tu plan",
  }
);
