import { defineMessages } from "../../helpers/i18n";

/**
 * Accounts, pockets and debts: what they are worth or still owe, and the
 * value / balance checks. A debt reads differently from an asset (repaid /
 * owed / interest instead of invested / value / gain), and Spanish nouns
 * carry gender ("cuenta", "bolsillo", "deuda"), so sentences are keyed per
 * domain rather than built from a noun.
 */
export const INVESTMENT_MESSAGES = defineMessages(
  {
    // The "No account" bucket. A debt's list row says "Unassigned": "No debt" reads as debt-free.
    "bucket.INVESTMENT": "No account",
    "bucket.SAVING": "No pocket",
    "bucket.DEBT": "No debt",
    "bucket.unassigned": "Unassigned",

    // DomainValueLine, under a dashboard card's monthly figure.
    "line.worth": "Worth {amount}",
    "line.worth.checked": "Worth {amount} · checked {date}",
    "line.worth.estimated": "Worth {amount} · estimated",
    "line.owed.checked": "Owed {amount} · checked {date}",

    "update.value": "Update value",
    "update.balance": "Update balance",

    // AccountValueList
    "list.title.value": "Value",
    "list.title.balances": "Balances",
    "list.empty.INVESTMENT":
      "Nothing here yet — file a contribution under an account to track its value",
    "list.empty.SAVING": "Nothing here yet — file a deposit under a pocket to track its value",
    "list.empty.DEBT": "Nothing here yet — file a repayment under a debt to track its balance",
    "list.in": "In {amount}",
    "list.repaid": "Repaid (net) {amount}",
    "status.checked": "checked {date}",
    "status.noBalance": "no balance yet",
    "status.estimated": "estimated",
    "status.noCheck": "no value check yet",

    // RecordValueModal
    "record.title.value": "Update current value",
    "record.title.balance": "Update current balance",
    "record.empty.INVESTMENT": "No account to value yet — file a contribution under one first.",
    "record.empty.SAVING": "No pocket to value yet — file a deposit under one first.",
    "record.empty.DEBT": "No debt to record a balance for yet — file a repayment under one first.",
    "record.pick.INVESTMENT": "Pick an account",
    "record.pick.SAVING": "Pick a pocket",
    "record.pick.DEBT": "Pick a debt",
    "record.inSoFar": "In so far:",

    // InvestmentValuePanel
    "panel.title.value": "{name} — value",
    "panel.title.balance": "{name} — balance",
    "panel.invested": "Invested",
    "panel.repaid": "Repaid",
    "panel.currentValue": "Current value",
    "panel.owed": "Owed",
    "panel.value": "Value",
    "panel.gain": "Gain",
    "panel.interest": "Interest",
    "panel.sinceFirstBalance": "since the first balance",
    "panel.checked": "checked {date}",
    "panel.checkedRate": "checked {date}, {rate} since",
    "panel.noBalanceCheck": "no balance check yet",
    "panel.estimatedAt": "estimated at {rate}",
    "panel.noValueCheck": "no value check yet",
    "panel.gainOn": "{pct} on {amount}",
    "panel.actions": "Actions for valuation {date}",
    "panel.deleting": "Deleting…",

    // ValuationModal
    "modal.title.value": "Value {name}",
    "modal.title.editValue": "Edit valuation — {name}",
    "modal.title.balance": "Balance — {name}",
    "modal.title.editBalance": "Edit balance — {name}",
    "modal.investedSoFar": "Invested so far:",
    "modal.repaidSoFar": "Repaid so far:",
    "modal.asOf": "As of",
    "modal.balanceOwed": "Balance owed",
    "modal.currentValue": "Current value",
    "modal.gainPct": "Gain %",
    "modal.nothingPaidIn.INVESTMENT":
      "Nothing has been paid into this account yet, so there is no gain % to work out — just what it's worth.",
    "modal.nothingPaidIn.SAVING":
      "Nothing has been paid into this pocket yet, so there is no gain % to work out — just what it's worth.",
    "modal.nothingPaidIn.DEBT":
      "Nothing has been paid into this debt yet, so there is no gain % to work out — just what it's worth.",
    "modal.nothingNet":
      "Nothing is net invested after withdrawals, so there is no gain % to type — just what the position is worth.",
    "modal.eitherOne":
      "Type either one — the other follows. Override the value if your broker says otherwise.",
    "modal.noCategory": "No category",
    "modal.categoryHint.debt":
      "Where the interest & charges this balance reveals belong in the month's breakdown. A debt can hold several categories and only you know which one moved.",
    "modal.categoryHint.asset":
      "Where this gain belongs in the month's breakdown. An account can hold several holdings and only you know which one moved.",
    "modal.note": "Note (optional)",
    "modal.notePlaceholder": "e.g. Q2 statement",
    "modal.saveChanges": "Save changes",
    "modal.record": "Record",
    "modal.error.balance": "Enter the balance owed",
    "modal.error.value": "Enter a value or a gain %",
    "modal.error.date": "Pick a date",
    "modal.error.save": "Couldn't save — try again",
  },
  {
    "bucket.INVESTMENT": "Sin cuenta",
    "bucket.SAVING": "Sin bolsillo",
    "bucket.DEBT": "Sin deuda asignada",
    "bucket.unassigned": "Sin asignar",

    "line.worth": "Valor {amount}",
    "line.worth.checked": "Valor {amount} · revisado el {date}",
    "line.worth.estimated": "Valor {amount} · estimado",
    "line.owed.checked": "Adeudado {amount} · revisado el {date}",

    "update.value": "Actualizar valor",
    "update.balance": "Actualizar saldo",

    "list.title.value": "Valor",
    "list.title.balances": "Saldos",
    "list.empty.INVESTMENT":
      "Aún no hay nada: registra un aporte en una cuenta para seguir su valor",
    "list.empty.SAVING":
      "Aún no hay nada: registra un depósito en un bolsillo para seguir su valor",
    "list.empty.DEBT": "Aún no hay nada: registra un abono en una deuda para seguir su saldo",
    "list.in": "Aportado {amount}",
    "list.repaid": "Abonado (neto) {amount}",
    "status.checked": "revisado el {date}",
    "status.noBalance": "sin saldo aún",
    "status.estimated": "estimado",
    "status.noCheck": "sin valor registrado aún",

    "record.title.value": "Actualizar valor actual",
    "record.title.balance": "Actualizar saldo actual",
    "record.empty.INVESTMENT": "Aún no hay cuentas que valorar: primero registra un aporte en una.",
    "record.empty.SAVING": "Aún no hay bolsillos que valorar: primero registra un depósito en uno.",
    "record.empty.DEBT":
      "Aún no hay deudas a las que registrarles saldo: primero registra un abono en una.",
    "record.pick.INVESTMENT": "Elige una cuenta",
    "record.pick.SAVING": "Elige un bolsillo",
    "record.pick.DEBT": "Elige una deuda",
    "record.inSoFar": "Aportado hasta ahora:",

    "panel.title.value": "{name} — valor",
    "panel.title.balance": "{name} — saldo",
    "panel.invested": "Invertido",
    "panel.repaid": "Abonado",
    "panel.currentValue": "Valor actual",
    "panel.owed": "Adeudado",
    "panel.value": "Valor",
    "panel.gain": "Ganancia",
    "panel.interest": "Intereses",
    "panel.sinceFirstBalance": "desde el primer saldo",
    "panel.checked": "revisado el {date}",
    "panel.checkedRate": "revisado el {date}, al {rate} desde entonces",
    "panel.noBalanceCheck": "sin saldo registrado aún",
    "panel.estimatedAt": "estimado al {rate}",
    "panel.noValueCheck": "sin valor registrado aún",
    "panel.gainOn": "{pct} sobre {amount}",
    "panel.actions": "Acciones del valor del {date}",
    "panel.deleting": "Eliminando…",

    "modal.title.value": "Valorar {name}",
    "modal.title.editValue": "Editar valor — {name}",
    "modal.title.balance": "Saldo — {name}",
    "modal.title.editBalance": "Editar saldo — {name}",
    "modal.investedSoFar": "Invertido hasta ahora:",
    "modal.repaidSoFar": "Abonado hasta ahora:",
    "modal.asOf": "Fecha",
    "modal.balanceOwed": "Saldo adeudado",
    "modal.currentValue": "Valor actual",
    "modal.gainPct": "% de ganancia",
    "modal.nothingPaidIn.INVESTMENT":
      "Aún no has aportado nada a esta cuenta, así que no hay % de ganancia que calcular: solo lo que vale.",
    "modal.nothingPaidIn.SAVING":
      "Aún no has aportado nada a este bolsillo, así que no hay % de ganancia que calcular: solo lo que vale.",
    "modal.nothingPaidIn.DEBT":
      "Aún no has abonado nada a esta deuda, así que no hay % de ganancia que calcular: solo lo que vale.",
    "modal.nothingNet":
      "Después de los retiros no queda nada invertido neto, así que no hay % de ganancia que escribir: solo lo que vale la posición.",
    "modal.eitherOne":
      "Escribe cualquiera de los dos y el otro se ajusta. Corrige el valor si tu bróker dice otra cosa.",
    "modal.noCategory": "Sin categoría",
    "modal.categoryHint.debt":
      "Dónde van, en el desglose del mes, los intereses y cargos que revela este saldo. Una deuda puede tener varias categorías y solo tú sabes cuál se movió.",
    "modal.categoryHint.asset":
      "Dónde va esta ganancia en el desglose del mes. Una cuenta puede tener varias inversiones y solo tú sabes cuál se movió.",
    "modal.note": "Nota (opcional)",
    "modal.notePlaceholder": "p. ej. extracto de junio",
    "modal.saveChanges": "Guardar cambios",
    "modal.record": "Registrar",
    "modal.error.balance": "Escribe el saldo adeudado",
    "modal.error.value": "Escribe un valor o un % de ganancia",
    "modal.error.date": "Elige una fecha",
    "modal.error.save": "No se pudo guardar. Intenta de nuevo.",
  }
);
