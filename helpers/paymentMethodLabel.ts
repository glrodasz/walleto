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
