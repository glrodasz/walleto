import { defineMessages } from "../../helpers/i18n";

/** SubscriptionInsights: what subscriptions cost and the rate a charged pair implies. */
export const INSIGHTS_MESSAGES = defineMessages(
  {
    title: "Subscription costs",
    monthly: "Monthly",
    annualized: "Annualized",
    ofIncome: "Of income",
    cost: "{monthly}/mo · ≈ {yearly}/yr",
    next: "Next {date}",
    impliedRate: "≈{rate} implied rate",
  },
  {
    title: "Costo de suscripciones",
    monthly: "Mensual",
    annualized: "Anualizado",
    ofIncome: "Del ingreso",
    cost: "{monthly}/mes · ≈ {yearly}/año",
    next: "Próximo: {date}",
    impliedRate: "≈{rate} de tasa implícita",
  },
  {
    title: "Custo das assinaturas",
    monthly: "Mensal",
    annualized: "Anualizado",
    ofIncome: "Da receita",
    cost: "{monthly}/mês · ≈ {yearly}/ano",
    next: "Próximo: {date}",
    impliedRate: "≈{rate} de taxa implícita",
  }
);
