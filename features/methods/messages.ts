import { defineMessages } from "../../helpers/i18n";

/** Saved payment methods (MethodsList) and editing one (EditMethodModal). */
export const METHOD_MESSAGES = defineMessages(
  {
    "list.title": "Saved methods",
    "list.emptyTitle": "No payment methods yet",
    "list.emptyDescription": "Add one above to link it to your incomes and expenses.",
    "list.edit": "Edit {name}",
    "list.defaultCurrency": "Default {currency}",
    "list.noDefaultCurrency": "No default currency",
    "list.archiving": "Archiving…",

    "edit.title": "Edit {name}",
    "edit.nameRequired": "Give it a name",
    "edit.saveFailed": "Couldn't save — try again",
    "edit.defaultCurrency": "Default currency",
    "edit.saveChanges": "Save changes",
  },
  {
    "list.title": "Medios guardados",
    "list.emptyTitle": "Aún no tienes medios de pago",
    "list.emptyDescription": "Agrega uno arriba para vincularlo a tus ingresos y gastos.",
    "list.edit": "Editar {name}",
    "list.defaultCurrency": "Por defecto en {currency}",
    "list.noDefaultCurrency": "Sin moneda por defecto",
    "list.archiving": "Archivando…",

    "edit.title": "Editar {name}",
    "edit.nameRequired": "Ponle un nombre",
    "edit.saveFailed": "No se pudo guardar. Intenta de nuevo.",
    "edit.defaultCurrency": "Moneda por defecto",
    "edit.saveChanges": "Guardar cambios",
  }
);
