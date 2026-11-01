import { defineMessages } from "../helpers/i18n";

/**
 * Copy that belongs to a route in `pages/`: the onboarding steps' page-level
 * text, the sign-in error, the privacy policy and the document's meta tags.
 * Whatever a screen's body says lives with its feature.
 */
export const PAGE_MESSAGES = defineMessages(
  {
    "meta.description": "A clear plan today, a freer tomorrow.",

    "onboarding.categories.description":
      "Your plan is sorted by category. Keep the defaults or add your own.",
    "onboarding.methods.description":
      "How you pay: your cards and accounts, so each plan item knows where it is charged.",
    "onboarding.review.description":
      "Here is your plan as the dashboard will show it. Go back to any step to change it.",
    "onboarding.incomes.heading": "What do you earn each month?",
    "onboarding.expenses.heading": "What do you pay every month?",
    "onboarding.currencies.saveFailed": "Could not save your currencies. Please try again.",
    "onboarding.methods.saveFailed": "Could not save your payment methods. Please try again.",
    "onboarding.incomes.saveFailed": "Could not save your income. Please try again.",
    "onboarding.expenses.saveFailed": "Could not save your expenses. Please try again.",
    "onboarding.review.finishFailed": "Could not finish setup. Please try again.",
    "onboarding.review.finish": "Finish",

    "loginError.title": "Sign-in failed · Walleto",
    "loginError.heading": "Sign-in failed",
    "loginError.body":
      "We couldn't complete the sign-in. This usually means the deployment's URL isn't allowed by Auth0 yet, or a previous attempt expired.",
    "loginError.reason": "Reason:",
    "loginError.retry": "Try again",
    "loginError.home": "Back to home",

    "privacy.title": "Privacy Policy · Walleto",
    "privacy.back": "Back to Walleto",
    "privacy.heading": "Privacy Policy",
    "privacy.updated": "Last updated: {date}",
    "privacy.overview.title": "Overview",
    "privacy.overview.body":
      "Walleto is a personal finance planner. This policy explains what information we collect, how we use it, and the choices you have. By using Walleto, you agree to the collection and use of information as described here.",
    "privacy.collect.title": "Information we collect",
    "privacy.collect.intro": "We collect only what the app needs to work:",
    "privacy.collect.account":
      "**Account information** — your name and email address, provided by our authentication provider when you sign in.",
    "privacy.collect.financial":
      "**Financial data you enter** — recurring items, transactions, categories, tags, payment methods, accounts, and balances you add to your plan. We never connect to your bank; every figure is one you typed in yourself.",
    "privacy.collect.preferences":
      "**Preferences** — currency, date format, theme, and similar display settings.",
    "privacy.use.title": "How we use your information",
    "privacy.use.body":
      "We use your information solely to operate Walleto: to show your plan, activity and net worth, to convert amounts between currencies, and to keep your preferences across sessions. We do not sell your data, and we do not use it for advertising.",
    "privacy.storage.title": "Data storage & security",
    "privacy.storage.body":
      "Your data is stored in Google Cloud Firestore and transmitted over encrypted connections. Authentication is handled by Auth0; Walleto never sees or stores your password. Signing out clears any financial data cached on that device.",
    "privacy.thirdParty.title": "Third-party services",
    "privacy.thirdParty.body":
      "We rely on a small number of providers to run the app: Auth0 for sign-in, Google Cloud Firestore for storage, and a currency exchange-rate provider to convert amounts between currencies. These providers process data only as needed to deliver their service to us.",
    "privacy.retention.title": "Data retention & deletion",
    "privacy.retention.before":
      "We keep your data for as long as your account is active. You can request an export or full deletion of your account and its data at any time by writing to",
    "privacy.retention.after":
      ". Deletion removes your financial records permanently and cannot be undone.",
    "privacy.retention.subject": "Delete my Walleto account",
    "privacy.rights.title": "Your rights",
    "privacy.rights.body":
      "Depending on where you live, you may have the right to access, correct, export, or delete your personal information. Contact us using the email above to exercise any of these rights.",
    "privacy.children.title": "Children's privacy",
    "privacy.children.body":
      "Walleto is not directed at children under 16, and we do not knowingly collect information from them.",
    "privacy.changes.title": "Changes to this policy",
    "privacy.changes.body":
      "We may update this policy from time to time. Material changes will be reflected by updating the date at the top of this page.",
    "privacy.contact.title": "Contact us",
    "privacy.contact.before": "Questions about this policy or your data? Write to us at",
    "privacy.contact.after": ".",
  },
  {
    "meta.description": "Un plan claro hoy, un mañana más libre.",

    "onboarding.categories.description":
      "Tu plan se organiza por categorías. Conserva las predeterminadas o agrega las tuyas.",
    "onboarding.methods.description":
      "Cómo pagas: tus tarjetas y cuentas, para que cada elemento del plan sepa dónde se cobra.",
    "onboarding.review.description":
      "Así se verá tu plan en el inicio. Vuelve a cualquier paso para cambiarlo.",
    "onboarding.incomes.heading": "¿Cuánto ganas cada mes?",
    "onboarding.expenses.heading": "¿Qué pagas cada mes?",
    "onboarding.currencies.saveFailed": "No se pudieron guardar tus monedas. Intenta de nuevo.",
    "onboarding.methods.saveFailed": "No se pudieron guardar tus medios de pago. Intenta de nuevo.",
    "onboarding.incomes.saveFailed": "No se pudieron guardar tus ingresos. Intenta de nuevo.",
    "onboarding.expenses.saveFailed": "No se pudieron guardar tus gastos. Intenta de nuevo.",
    "onboarding.review.finishFailed": "No se pudo terminar la configuración. Intenta de nuevo.",
    "onboarding.review.finish": "Terminar",

    "loginError.title": "No se pudo iniciar sesión · Walleto",
    "loginError.heading": "No se pudo iniciar sesión",
    "loginError.body":
      "No pudimos completar el inicio de sesión. Esto suele significar que Auth0 todavía no permite la URL de este despliegue, o que un intento anterior expiró.",
    "loginError.reason": "Motivo:",
    "loginError.retry": "Reintentar",
    "loginError.home": "Volver al inicio",

    "privacy.title": "Política de privacidad · Walleto",
    "privacy.back": "Volver a Walleto",
    "privacy.heading": "Política de privacidad",
    "privacy.updated": "Última actualización: {date}",
    "privacy.overview.title": "Resumen",
    "privacy.overview.body":
      "Walleto es un planificador de finanzas personales. Esta política explica qué información recopilamos, cómo la usamos y qué opciones tienes. Al usar Walleto, aceptas la recopilación y el uso de la información como se describe aquí.",
    "privacy.collect.title": "Información que recopilamos",
    "privacy.collect.intro": "Solo recopilamos lo que la app necesita para funcionar:",
    "privacy.collect.account":
      "**Información de la cuenta**: tu nombre y correo electrónico, que nos entrega nuestro proveedor de autenticación cuando inicias sesión.",
    "privacy.collect.financial":
      "**Datos financieros que ingresas**: elementos recurrentes, movimientos, categorías, etiquetas, medios de pago, cuentas y saldos que agregas a tu plan. Nunca nos conectamos a tu banco; cada cifra es una que tú escribiste.",
    "privacy.collect.preferences":
      "**Preferencias**: moneda, formato de fecha, tema y ajustes de visualización similares.",
    "privacy.use.title": "Cómo usamos tu información",
    "privacy.use.body":
      "Usamos tu información únicamente para operar Walleto: mostrar tu plan, tu actividad y tu patrimonio, convertir montos entre monedas y conservar tus preferencias entre sesiones. No vendemos tus datos ni los usamos para publicidad.",
    "privacy.storage.title": "Almacenamiento y seguridad de los datos",
    "privacy.storage.body":
      "Tus datos se guardan en Google Cloud Firestore y viajan por conexiones cifradas. La autenticación la maneja Auth0; Walleto nunca ve ni guarda tu contraseña. Al cerrar sesión se borran los datos financieros guardados en ese dispositivo.",
    "privacy.thirdParty.title": "Servicios de terceros",
    "privacy.thirdParty.body":
      "Usamos unos pocos proveedores para operar la app: Auth0 para iniciar sesión, Google Cloud Firestore para el almacenamiento y un proveedor de tasas de cambio para convertir montos entre monedas. Estos proveedores procesan los datos solo en la medida necesaria para prestarnos su servicio.",
    "privacy.retention.title": "Conservación y eliminación de los datos",
    "privacy.retention.before":
      "Conservamos tus datos mientras tu cuenta esté activa. Puedes pedir una exportación o la eliminación completa de tu cuenta y sus datos en cualquier momento escribiendo a",
    "privacy.retention.after":
      ". La eliminación borra tus registros financieros de forma permanente y no se puede deshacer.",
    "privacy.retention.subject": "Eliminar mi cuenta de Walleto",
    "privacy.rights.title": "Tus derechos",
    "privacy.rights.body":
      "Según dónde vivas, puedes tener derecho a acceder, corregir, exportar o eliminar tu información personal. Escríbenos al correo de arriba para ejercer cualquiera de estos derechos.",
    "privacy.children.title": "Privacidad de menores",
    "privacy.children.body":
      "Walleto no está dirigido a menores de 16 años y no recopilamos información de ellos a sabiendas.",
    "privacy.changes.title": "Cambios a esta política",
    "privacy.changes.body":
      "Podemos actualizar esta política de vez en cuando. Los cambios importantes se reflejarán actualizando la fecha al inicio de esta página.",
    "privacy.contact.title": "Contáctanos",
    "privacy.contact.before": "¿Preguntas sobre esta política o tus datos? Escríbenos a",
    "privacy.contact.after": ".",
  },
  {
    "meta.description": "Um plano claro hoje, um amanhã mais livre.",

    "onboarding.categories.description":
      "Seu plano se organiza por categorias. Mantenha as padrão ou adicione as suas.",
    "onboarding.methods.description":
      "Como você paga: seus cartões e contas, para que cada item do plano saiba onde é cobrado.",
    "onboarding.review.description":
      "É assim que seu plano vai aparecer no início. Volte a qualquer passo para mudá-lo.",
    "onboarding.incomes.heading": "Quanto você ganha por mês?",
    "onboarding.expenses.heading": "O que você paga todo mês?",
    "onboarding.currencies.saveFailed": "Não foi possível salvar suas moedas. Tente de novo.",
    "onboarding.methods.saveFailed":
      "Não foi possível salvar suas formas de pagamento. Tente de novo.",
    "onboarding.incomes.saveFailed": "Não foi possível salvar suas receitas. Tente de novo.",
    "onboarding.expenses.saveFailed": "Não foi possível salvar suas despesas. Tente de novo.",
    "onboarding.review.finishFailed": "Não foi possível concluir a configuração. Tente de novo.",
    "onboarding.review.finish": "Concluir",

    "loginError.title": "Não foi possível entrar · Walleto",
    "loginError.heading": "Não foi possível entrar",
    "loginError.body":
      "Não conseguimos concluir o login. Isso geralmente significa que o Auth0 ainda não permite a URL desta implantação, ou que uma tentativa anterior expirou.",
    "loginError.reason": "Motivo:",
    "loginError.retry": "Tentar de novo",
    "loginError.home": "Voltar ao início",

    "privacy.title": "Política de privacidade · Walleto",
    "privacy.back": "Voltar ao Walleto",
    "privacy.heading": "Política de privacidade",
    "privacy.updated": "Última atualização: {date}",
    "privacy.overview.title": "Resumo",
    "privacy.overview.body":
      "O Walleto é um planejador de finanças pessoais. Esta política explica quais informações coletamos, como as usamos e quais opções você tem. Ao usar o Walleto, você concorda com a coleta e o uso das informações conforme descrito aqui.",
    "privacy.collect.title": "Informações que coletamos",
    "privacy.collect.intro": "Coletamos apenas o que o app precisa para funcionar:",
    "privacy.collect.account":
      "**Informações da conta**: seu nome e e-mail, fornecidos pelo nosso provedor de autenticação quando você entra.",
    "privacy.collect.financial":
      "**Dados financeiros que você insere**: itens recorrentes, lançamentos, categorias, etiquetas, formas de pagamento, contas e saldos que você adiciona ao seu plano. Nunca nos conectamos ao seu banco; cada número é um que você digitou.",
    "privacy.collect.preferences":
      "**Preferências**: moeda, formato de data, tema e ajustes de exibição semelhantes.",
    "privacy.use.title": "Como usamos suas informações",
    "privacy.use.body":
      "Usamos suas informações apenas para operar o Walleto: mostrar seu plano, sua atividade e seu patrimônio, converter valores entre moedas e manter suas preferências entre sessões. Não vendemos seus dados nem os usamos para publicidade.",
    "privacy.storage.title": "Armazenamento e segurança dos dados",
    "privacy.storage.body":
      "Seus dados ficam no Google Cloud Firestore e trafegam por conexões criptografadas. A autenticação é feita pelo Auth0; o Walleto nunca vê nem guarda sua senha. Ao sair, os dados financeiros salvos naquele dispositivo são apagados.",
    "privacy.thirdParty.title": "Serviços de terceiros",
    "privacy.thirdParty.body":
      "Usamos poucos provedores para operar o app: Auth0 para o login, Google Cloud Firestore para o armazenamento e um provedor de taxas de câmbio para converter valores entre moedas. Esses provedores processam os dados apenas na medida necessária para nos prestar o serviço.",
    "privacy.retention.title": "Retenção e exclusão dos dados",
    "privacy.retention.before":
      "Mantemos seus dados enquanto sua conta estiver ativa. Você pode pedir uma exportação ou a exclusão completa da sua conta e dos seus dados a qualquer momento escrevendo para",
    "privacy.retention.after":
      ". A exclusão apaga seus registros financeiros de forma permanente e não pode ser desfeita.",
    "privacy.retention.subject": "Excluir minha conta do Walleto",
    "privacy.rights.title": "Seus direitos",
    "privacy.rights.body":
      "Dependendo de onde você mora, você pode ter o direito de acessar, corrigir, exportar ou excluir suas informações pessoais. Escreva para o e-mail acima para exercer qualquer um desses direitos.",
    "privacy.children.title": "Privacidade de menores",
    "privacy.children.body":
      "O Walleto não é destinado a menores de 16 anos e não coletamos informações deles intencionalmente.",
    "privacy.changes.title": "Alterações nesta política",
    "privacy.changes.body":
      "Podemos atualizar esta política de tempos em tempos. Mudanças importantes serão indicadas pela atualização da data no topo desta página.",
    "privacy.contact.title": "Fale conosco",
    "privacy.contact.before": "Dúvidas sobre esta política ou seus dados? Escreva para",
    "privacy.contact.after": ".",
  }
);
