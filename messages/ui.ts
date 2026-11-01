import { defineMessages } from "../helpers/i18n";

/**
 * Generic building blocks — atoms and the molecules any screen mounts
 * (combobox, error and empty states, pager, menus, month picker, privacy
 * toggle, the error boundary).
 */
export const UI_MESSAGES = defineMessages(
  {
    "language.label": "Language",
    "language.current": "Language: {language}",
    "combobox.placeholder": "Search or create",
    "combobox.create": "Create",

    "error.title": "Couldn't load this data",
    "error.description": "Something went wrong on our side. Try reloading the page.",
    "error.createIndex": "Create the missing index →",

    "section.viewAll": "View all",
    "field.moreInfo": "More information",

    "build.viewCommit": "{sha} — view commit on GitHub",
    "build.stagingCommit": "Staging build {sha} — view commit on GitHub",

    "kebab.moreOptions": "More options",

    "pager.label": "Pages",
    "pager.previous": "Previous",
    "pager.status": "Page {page} of {count}",

    "privacy.show": "Show amounts",
    "privacy.hide": "Hide amounts",

    "scenario.label": "Variable expenses count at",
    "scenario.floor": "Best",
    "scenario.average": "Average",
    "scenario.top": "Worst",
    "scenario.current": "Variable expenses count at {scenario}",
    "scenario.hint": "Best uses the low end of each range, Worst the high end.",

    "delta.up": "Up {pct}%",
    "delta.down": "Down {pct}%",

    "grouped.transactions": {
      one: "{count} transaction · {share}%",
      other: "{count} transactions · {share}%",
    },
    "grouped.share": "{label} share",

    "month.previous": "Previous month",
    "month.next": "Next month",
    "month.current": "Month: {month}",
    "month.showLast": "Show last {count} months",

    "boundary.title": "Something went wrong",
    "boundary.body": "An unexpected error occurred. Reloading the page usually fixes it.",
    "boundary.reload": "Reload",
  },
  {
    "language.label": "Idioma",
    "language.current": "Idioma: {language}",
    "combobox.placeholder": "Busca o crea",
    "combobox.create": "Crear",

    "error.title": "No se pudieron cargar estos datos",
    "error.description": "Algo salió mal de nuestro lado. Intenta recargar la página.",
    "error.createIndex": "Crear el índice que falta →",

    "section.viewAll": "Ver todo",
    "field.moreInfo": "Más información",

    "build.viewCommit": "{sha} — ver el commit en GitHub",
    "build.stagingCommit": "Versión de staging {sha} — ver el commit en GitHub",

    "kebab.moreOptions": "Más opciones",

    "pager.label": "Páginas",
    "pager.previous": "Anterior",
    "pager.status": "Página {page} de {count}",

    "privacy.show": "Mostrar montos",
    "privacy.hide": "Ocultar montos",

    "scenario.label": "Los gastos variables cuentan en",
    "scenario.floor": "Mejor",
    "scenario.average": "Promedio",
    "scenario.top": "Peor",
    "scenario.current": "Los gastos variables cuentan en {scenario}",
    "scenario.hint": "Mejor usa el extremo bajo de cada rango; Peor, el alto.",

    "delta.up": "Sube {pct}%",
    "delta.down": "Baja {pct}%",

    "grouped.transactions": {
      one: "{count} movimiento · {share}%",
      other: "{count} movimientos · {share}%",
    },
    "grouped.share": "Participación de {label}",

    "month.previous": "Mes anterior",
    "month.next": "Mes siguiente",
    "month.current": "Mes: {month}",
    "month.showLast": "Ver los últimos {count} meses",

    "boundary.title": "Algo salió mal",
    "boundary.body": "Ocurrió un error inesperado. Recargar la página suele solucionarlo.",
    "boundary.reload": "Recargar",
  },
  {
    "language.label": "Idioma",
    "language.current": "Idioma: {language}",
    "combobox.placeholder": "Busque ou crie",
    "combobox.create": "Criar",

    "error.title": "Não foi possível carregar estes dados",
    "error.description": "Algo deu errado do nosso lado. Tente recarregar a página.",
    "error.createIndex": "Criar o índice que falta →",

    "section.viewAll": "Ver tudo",
    "field.moreInfo": "Mais informações",

    "build.viewCommit": "{sha} — ver o commit no GitHub",
    "build.stagingCommit": "Versão de staging {sha} — ver o commit no GitHub",

    "kebab.moreOptions": "Mais opções",

    "pager.label": "Páginas",
    "pager.previous": "Anterior",
    "pager.status": "Página {page} de {count}",

    "privacy.show": "Mostrar valores",
    "privacy.hide": "Ocultar valores",

    "scenario.label": "Despesas variáveis contam no cenário",
    "scenario.floor": "Melhor",
    "scenario.average": "Média",
    "scenario.top": "Pior",
    "scenario.current": "Despesas variáveis contam no cenário {scenario}",
    "scenario.hint": "Melhor usa o valor mais baixo de cada faixa; Pior, o mais alto.",

    "delta.up": "Sobe {pct}%",
    "delta.down": "Cai {pct}%",

    "grouped.transactions": {
      one: "{count} lançamento · {share}%",
      other: "{count} lançamentos · {share}%",
    },
    "grouped.share": "Participação de {label}",

    "month.previous": "Mês anterior",
    "month.next": "Próximo mês",
    "month.current": "Mês: {month}",
    "month.showLast": "Ver os últimos {count} meses",

    "boundary.title": "Algo deu errado",
    "boundary.body": "Ocorreu um erro inesperado. Recarregar a página costuma resolver.",
    "boundary.reload": "Recarregar",
  }
);
