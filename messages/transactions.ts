import { defineMessages } from "../helpers/i18n";

/** The Activity list (TransactionsTable): toolbar, filters, sort and each row's labels. */
export const TRANSACTION_MESSAGES = defineMessages(
  {
    "search.label": "Search transactions",
    "search.placeholder": "Search transactions…",
    "filters.toggle": "Filters",
    "filters.category": "Category filter",
    "filters.allCategories": "All categories",
    "filters.method": "Method filter",
    "filters.allMethods": "All methods",
    "filters.noMethod": "No method",
    "filters.sort": "Sort",
    "filters.noMatch": "Nothing matches these filters",
    more: "and {count} more in this period",

    "sort.date-desc": "Newest first",
    "sort.date-asc": "Oldest first",
    "sort.amount-desc": "Largest amount",
    "sort.amount-asc": "Smallest amount",

    "origin.shareOf": "{amount} {cadence}, reflected monthly",
    "origin.share": "reflected monthly",
    "origin.oneOff": "one-off",
    "origin.recurring": "recurring",
    "origin.earlier": "recurring · earlier schedule",
    "origin.cadence": "recurring · {cadence}",

    "badge.monthlyShare": "Monthly share",
    "badge.pending": "To confirm",
    "action.confirm": "Confirm amount",
    "action.keepVariable": "Keep it variable",
    charged: "charged {amount}",
    shareLabel: "{name}: monthly share, edit {item}",
    "shareLabel.theItem": "the item",
    deleting: "Deleting…",
  },
  {
    "search.label": "Buscar movimientos",
    "search.placeholder": "Buscar movimientos…",
    "filters.toggle": "Filtros",
    "filters.category": "Filtro de categoría",
    "filters.allCategories": "Todas las categorías",
    "filters.method": "Filtro de medio de pago",
    "filters.allMethods": "Todos los medios",
    "filters.noMethod": "Sin medio de pago",
    "filters.sort": "Ordenar",
    "filters.noMatch": "Nada coincide con estos filtros",
    more: "y {count} más en este período",

    "sort.date-desc": "Más recientes primero",
    "sort.date-asc": "Más antiguos primero",
    "sort.amount-desc": "Mayor monto",
    "sort.amount-asc": "Menor monto",

    "origin.shareOf": "{amount} {cadence}, repartido por mes",
    "origin.share": "repartido por mes",
    "origin.oneOff": "puntual",
    "origin.recurring": "recurrente",
    "origin.earlier": "recurrente · calendario anterior",
    "origin.cadence": "recurrente · {cadence}",

    "badge.monthlyShare": "Cuota mensual",
    "badge.pending": "Por confirmar",
    "action.confirm": "Confirmar monto",
    "action.keepVariable": "Dejarlo variable",
    charged: "cobrado {amount}",
    shareLabel: "{name}: cuota mensual, editar {item}",
    "shareLabel.theItem": "el elemento",
    deleting: "Eliminando…",
  }
);
