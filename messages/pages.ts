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
  }
);
