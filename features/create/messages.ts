import { defineMessages } from "../../helpers/i18n";

/**
 * The floating "+" and its sheet. The option titles that the form repeats
 * ("Add expense to your plan", "Log a one-off expense") live with the form,
 * in `features/domains/messages`.
 */
export const CREATE_MESSAGES = defineMessages(
  {
    "sheet.type": "Type",
    "sheet.recurringHint": "Something that repeats: a subscription, a salary, rent",
    "sheet.oneOffHint": "A single amount on a date, already paid",
    "sheet.value.INVESTMENT": "Update current value",
    "sheet.value.SAVING": "Update current value",
    "sheet.value.DEBT": "Update current balance",
    "sheet.valueHint.INVESTMENT": "What an account is worth today, as a gain % or a value",
    "sheet.valueHint.SAVING": "What a pocket is worth today, as a gain % or a value",
    "sheet.valueHint.DEBT": "What you still owe on a debt today",
  },
  {
    "sheet.type": "Tipo",
    "sheet.recurringHint": "Algo que se repite: una suscripción, un salario, el arriendo",
    "sheet.oneOffHint": "Un solo monto en una fecha, ya pagado",
    "sheet.value.INVESTMENT": "Actualizar valor actual",
    "sheet.value.SAVING": "Actualizar valor actual",
    "sheet.value.DEBT": "Actualizar saldo actual",
    "sheet.valueHint.INVESTMENT": "Cuánto vale hoy una cuenta, como ganancia % o como valor",
    "sheet.valueHint.SAVING": "Cuánto vale hoy un bolsillo, como ganancia % o como valor",
    "sheet.valueHint.DEBT": "Cuánto debes hoy en una deuda",
  }
);
