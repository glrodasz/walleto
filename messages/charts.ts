import { defineMessages } from "../helpers/i18n";

/** Charts, their tooltips and legends, and the summary / stat cards. */
export const CHART_MESSAGES = defineMessages(
  {
    "chart.empty": "No activity in this period",
    "chart.stillPlanned": "Still planned",
    "chart.average": "Avg {amount}",
    "chart.monthlyTotals": "Monthly totals",
    "chart.monthlyCashFlow": "Monthly cash flow",
    "chart.stillPlannedRow": ", still planned {amount}",
    "chart.inProgress": " (in progress)",

    "breakdown.empty": "No data yet",
    "breakdown.share": "{name} share",

    "stat.open": "Open {title}",
    "stat.byCurrency": "By currency",
    "summary.breakdown": "{title} breakdown",

    "netFlow.title": "Monthly plan",
    "netFlow.overCommitted": "Over-committed",
    "netFlow.onPlan": "On plan",
    "netFlow.overSub": "more planned out than coming in, each month",
    "netFlow.leftSub": "left to allocate each month",
  },
  {
    "chart.empty": "Sin actividad en este período",
    "chart.stillPlanned": "Aún planeado",
    "chart.average": "Prom. {amount}",
    "chart.monthlyTotals": "Totales mensuales",
    "chart.monthlyCashFlow": "Flujo de caja mensual",
    "chart.stillPlannedRow": ", aún planeado {amount}",
    "chart.inProgress": " (en curso)",

    "breakdown.empty": "Aún no hay datos",
    "breakdown.share": "Participación de {name}",

    "stat.open": "Abrir {title}",
    "stat.byCurrency": "Por moneda",
    "summary.breakdown": "Desglose de {title}",

    "netFlow.title": "Plan mensual",
    "netFlow.overCommitted": "Sobrecomprometido",
    "netFlow.onPlan": "Dentro del plan",
    "netFlow.overSub": "más planeado para salir que lo que entra, cada mes",
    "netFlow.leftSub": "por asignar cada mes",
  }
);
