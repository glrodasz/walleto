import { defineMessages } from "../helpers/i18n";

/**
 * Labels that helpers build outside React (greeting, account and payment
 * method labels, validation errors, chart buckets). The helpers take a
 * `language` parameter and read this catalog with `translate`.
 */
export const LABEL_MESSAGES = defineMessages(
  {
    "greeting.morning": "Good morning",
    "greeting.afternoon": "Good afternoon",
    "greeting.evening": "Good evening",

    "rate.YEARLY": "{value}% yearly",
    "rate.MONTHLY": "{value}% monthly",

    "direction.DEBT.OUT": "Borrowed",
    "direction.DEBT.IN": "Repayment",
    "direction.OUT": "Withdrawal",
    "direction.IN": "Deposit",

    "accountDraft.nameRequired.INVESTMENT": "Give the account a name",
    "accountDraft.nameRequired.SAVING": "Give the pocket a name",
    "accountDraft.nameRequired.DEBT": "Give the debt a name",
    "accountDraft.rateRange": "Interest rate must be between 0 and 100",

    "method.endingIn": "ending in {last4}",
    "method.last4Error": "Enter all 4 digits, or leave it empty",
    "method.network.DIGITAL_WALLET": "Provider",
    "method.network.BANK_TRANSFER": "Method",
    "method.network.card": "Card network",

    "stack.other": "Other",
    "stack.unknown": "Unknown",
  },
  {
    "greeting.morning": "Buenos días",
    "greeting.afternoon": "Buenas tardes",
    "greeting.evening": "Buenas noches",

    "rate.YEARLY": "{value}% anual",
    "rate.MONTHLY": "{value}% mensual",

    "direction.DEBT.OUT": "Préstamo",
    "direction.DEBT.IN": "Abono",
    "direction.OUT": "Retiro",
    "direction.IN": "Depósito",

    "accountDraft.nameRequired.INVESTMENT": "Ponle un nombre a la cuenta",
    "accountDraft.nameRequired.SAVING": "Ponle un nombre al bolsillo",
    "accountDraft.nameRequired.DEBT": "Ponle un nombre a la deuda",
    "accountDraft.rateRange": "La tasa de interés debe estar entre 0 y 100",

    "method.endingIn": "terminada en {last4}",
    "method.last4Error": "Escribe los 4 dígitos o déjalo vacío",
    "method.network.DIGITAL_WALLET": "Proveedor",
    "method.network.BANK_TRANSFER": "Modalidad",
    "method.network.card": "Red de la tarjeta",

    "stack.other": "Otros",
    "stack.unknown": "Desconocida",
  }
);
