import { PAYMENT_METHOD_TYPE_LABELS } from "../constants";
import type { PaymentMethod } from "../types";

type LabelFields = Pick<PaymentMethod, "name" | "type" | "network" | "last4">;

/**
 * The short form for tables — what the mockup draws in the expenses table:
 * "Chase Sapphire - 4242", or just the name when there are no digits.
 */
export function paymentMethodLabel(method: LabelFields | undefined): string {
  if (!method) return "—";
  return method.last4 ? `${method.name} - ${method.last4}` : method.name;
}

/**
 * The long form for dropdowns, where the user has to tell methods apart
 * without any other context: "SEB - Autogiro (Bank transfer)",
 * "Chase Sapphire - Visa ••4242 (Credit card)".
 */
export function paymentMethodOptionLabel(method: LabelFields): string {
  const parts = [method.name];
  if (method.network) parts.push(`- ${method.network}`);
  if (method.last4) parts.push(`••${method.last4}`);
  parts.push(`(${PAYMENT_METHOD_TYPE_LABELS[method.type]})`);
  return parts.join(" ");
}

/**
 * The spoken form, for a method drawn as a card or a check (MethodFace):
 * the picture is decoration, so the button around it says what it is —
 * "Bancolombia Débito, Debit card, Mastercard, ending in 8817".
 */
export function paymentMethodDescription(method: LabelFields): string {
  const parts = [method.name, PAYMENT_METHOD_TYPE_LABELS[method.type]];
  if (method.network && method.network !== method.name) parts.push(method.network);
  if (method.last4) parts.push(`ending in ${method.last4}`);
  return parts.join(", ");
}
