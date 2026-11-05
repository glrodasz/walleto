import { defineMessages } from "../../helpers/i18n";

/** The Debts page's "What you owe" card and its quick payment form. */
export const DEBT_MESSAGES = defineMessages(
  {
    tag: "Debt",
    "owed.info":
      "The balance is what you still owe today. It counts in your net worth, not in your month: only the payments you make each month count there. A loan you wrote down as borrowed keeps its own balance (borrowed minus repaid); a mortgage needs a balance update once. Between updates the balance only drops with your payments; interest shows up the next time you update it.",
    "owed.monthlyLine": "You pay {amount} a month towards it",
    "owed.perMonth": "{amount}/mo",
    "owed.noPlan": "no monthly payment",
    "owed.paidOff": "Paid off",
    "owed.pay": "Pay",
    "owed.payAll": "Pay it all",
    "owed.borrow": "Borrowed more",
    "owed.update": "Update balance",
    "owed.actionsFor": "Actions for {name}",

    "pay.title.part": "Pay towards {name}",
    "pay.title.all": "Pay off {name}",
    "pay.title.borrow": "Borrowed more — {name}",
    "pay.owed": "You owe {amount}.",
    "pay.amount": "Amount",
    "pay.category": "Category",
    "pay.name.part": "Payment to {name}",
    "pay.name.borrow": "Borrowed — {name}",
    "pay.save.part": "Pay",
    "pay.save.all": "Pay it all",
    "pay.save.borrow": "Save",
    "pay.hint":
      "Saved as a one-time payment today. It counts in this month's debt payments and lowers the balance.",
    "pay.hint.borrow":
      "Saved as borrowed today. It raises the balance; it is not income and doesn't count in your month.",
    "pay.error.amount": "Enter an amount greater than zero",
    "pay.error.category": "Pick a category",
    "pay.error.save": "Couldn't save — try again",
  },
  {
    tag: "Deuda",
    "owed.info":
      "El saldo es lo que aún debes hoy. Cuenta en tu patrimonio, no en tu mes: en el mes solo cuentan los pagos que haces. Un préstamo anotado como prestado lleva su propio saldo (lo prestado menos lo abonado); una hipoteca necesita que actualices el saldo una vez. Entre actualizaciones el saldo solo baja con tus pagos; los intereses aparecen la próxima vez que lo actualices.",
    "owed.monthlyLine": "Pagas {amount} al mes para bajarla",
    "owed.perMonth": "{amount}/mes",
    "owed.noPlan": "sin pago mensual",
    "owed.paidOff": "Pagada",
    "owed.pay": "Abonar",
    "owed.payAll": "Pagar todo",
    "owed.borrow": "Pedí más prestado",
    "owed.update": "Actualizar saldo",
    "owed.actionsFor": "Acciones para {name}",

    "pay.title.part": "Abonar a {name}",
    "pay.title.all": "Pagar todo: {name}",
    "pay.title.borrow": "Pedí más prestado: {name}",
    "pay.owed": "Debes {amount}.",
    "pay.amount": "Monto",
    "pay.category": "Categoría",
    "pay.name.part": "Abono a {name}",
    "pay.name.borrow": "Prestado: {name}",
    "pay.save.part": "Abonar",
    "pay.save.all": "Pagar todo",
    "pay.save.borrow": "Guardar",
    "pay.hint":
      "Se guarda como un pago único de hoy. Cuenta en los pagos de deuda de este mes y baja el saldo.",
    "pay.hint.borrow":
      "Se guarda como prestado hoy. Sube el saldo; no es un ingreso y no cuenta en tu mes.",
    "pay.error.amount": "Escribe un monto mayor que cero",
    "pay.error.category": "Elige una categoría",
    "pay.error.save": "No se pudo guardar. Inténtalo de nuevo.",
  },
  {
    tag: "Dívida",
    "owed.info":
      "O saldo é o que você ainda deve hoje. Conta no seu patrimônio, não no seu mês: no mês só contam os pagamentos que você faz. Um empréstimo anotado como emprestado tem seu próprio saldo (o emprestado menos o amortizado); um financiamento precisa que você atualize o saldo uma vez. Entre atualizações o saldo só cai com seus pagamentos; os juros aparecem na próxima vez que você o atualizar.",
    "owed.monthlyLine": "Você paga {amount} por mês para reduzi-la",
    "owed.perMonth": "{amount}/mês",
    "owed.noPlan": "sem pagamento mensal",
    "owed.paidOff": "Quitada",
    "owed.pay": "Amortizar",
    "owed.payAll": "Quitar tudo",
    "owed.borrow": "Peguei mais emprestado",
    "owed.update": "Atualizar saldo",
    "owed.actionsFor": "Ações para {name}",

    "pay.title.part": "Amortizar {name}",
    "pay.title.all": "Quitar {name}",
    "pay.title.borrow": "Peguei mais emprestado: {name}",
    "pay.owed": "Você deve {amount}.",
    "pay.amount": "Valor",
    "pay.category": "Categoria",
    "pay.name.part": "Pagamento de {name}",
    "pay.name.borrow": "Emprestado: {name}",
    "pay.save.part": "Amortizar",
    "pay.save.all": "Quitar tudo",
    "pay.save.borrow": "Salvar",
    "pay.hint":
      "Fica salvo como um pagamento único de hoje. Conta nos pagamentos de dívida deste mês e reduz o saldo.",
    "pay.hint.borrow":
      "Fica salvo como emprestado hoje. Aumenta o saldo; não é receita e não conta no seu mês.",
    "pay.error.amount": "Digite um valor maior que zero",
    "pay.error.category": "Escolha uma categoria",
    "pay.error.save": "Não foi possível salvar. Tente de novo.",
  }
);
