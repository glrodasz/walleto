import { defineMessages } from "../../helpers/i18n";

/** The admin usage dashboard. */
export const ADMIN_MESSAGES = defineMessages(
  {
    "page.title": "Usage",
    "page.subtitle": "Who signs up and who keeps coming back. Only you can see this page.",
    "page.refresh": "Refresh",
    "page.updated": "Updated {time}",
    "page.loadError": "Couldn't load usage",

    "kpi.users": "Users",
    "kpi.usersSub": "{onboarded} finished setup",
    "kpi.dau": "Active today",
    "kpi.wau": "Active this week",
    "kpi.mau": "Active this month",
    "kpi.activeSub": "Last {days} days",
    "kpi.activeTodaySub": "Last 24 hours",
    "kpi.signups": "New this week",
    "kpi.signupsSub": "{count} in the last 30 days",
    "kpi.activeInfo":
      "Active means the app was opened, or the person logged in, within the window. Opening the app is recorded once a day.",

    "auth0.notConfigured":
      "Emails and logins need the Auth0 Management API. Add AUTH0_MGMT_CLIENT_ID and AUTH0_MGMT_CLIENT_SECRET to show them.",
    "auth0.error": "Auth0 didn't answer, so emails and logins are missing. Check the server logs.",

    "chart.title": "Signups per week",
    "chart.subtitle": "The last 12 weeks",
    "chart.week": "Week of {date}",
    "chart.signups": { one: "{count} signup", other: "{count} signups" },
    "chart.weeklyTotals": "Signups per week",

    "table.title": "People",
    "table.subtitle": "Most recently active first",
    "table.user": "User",
    "table.signedUp": "Signed up",
    "table.lastActive": "Last active",
    "table.logins": "Logins",
    "table.recurring": "Plan items",
    "table.transactions": "Activity",
    "table.accounts": "Accounts",
    "table.setup": "Setup",
    "table.done": "Done",
    "table.pending": "Pending",
    "table.never": "Never",
    "table.empty": "Nobody has signed up yet.",
  },
  {
    "page.title": "Uso",
    "page.subtitle": "Quién se registra y quién vuelve. Solo tú puedes ver esta página.",
    "page.refresh": "Actualizar",
    "page.updated": "Actualizado {time}",
    "page.loadError": "No se pudo cargar el uso",

    "kpi.users": "Usuarios",
    "kpi.usersSub": "{onboarded} terminaron la configuración",
    "kpi.dau": "Activos hoy",
    "kpi.wau": "Activos esta semana",
    "kpi.mau": "Activos este mes",
    "kpi.activeSub": "Últimos {days} días",
    "kpi.activeTodaySub": "Últimas 24 horas",
    "kpi.signups": "Nuevos esta semana",
    "kpi.signupsSub": "{count} en los últimos 30 días",
    "kpi.activeInfo":
      "Activo significa que abrió la app o inició sesión dentro del período. Abrir la app se registra una vez al día.",

    "auth0.notConfigured":
      "Los correos y los inicios de sesión necesitan la Management API de Auth0. Agrega AUTH0_MGMT_CLIENT_ID y AUTH0_MGMT_CLIENT_SECRET para verlos.",
    "auth0.error":
      "Auth0 no respondió, así que faltan los correos y los inicios de sesión. Revisa los logs del servidor.",

    "chart.title": "Registros por semana",
    "chart.subtitle": "Las últimas 12 semanas",
    "chart.week": "Semana del {date}",
    "chart.signups": { one: "{count} registro", other: "{count} registros" },
    "chart.weeklyTotals": "Registros por semana",

    "table.title": "Personas",
    "table.subtitle": "Las más activas recientemente primero",
    "table.user": "Usuario",
    "table.signedUp": "Registro",
    "table.lastActive": "Última actividad",
    "table.logins": "Inicios de sesión",
    "table.recurring": "Ítems del plan",
    "table.transactions": "Actividad",
    "table.accounts": "Cuentas",
    "table.setup": "Configuración",
    "table.done": "Lista",
    "table.pending": "Pendiente",
    "table.never": "Nunca",
    "table.empty": "Nadie se ha registrado todavía.",
  }
);
