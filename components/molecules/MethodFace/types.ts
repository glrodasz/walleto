import type { ReactNode } from "react";
import type { Currency, PaymentMethodType } from "../../../types";

export type MethodFaceSize = "compact" | "full";

/** The material a method is drawn on. */
export type FaceKind = "card" | "check" | "wallet" | "crypto" | "cash" | "ticket" | "blank";

export interface MethodFaceProps {
  /** "" is a draft that hasn't picked a type yet: a dashed placeholder. */
  type: PaymentMethodType | "";
  name: string;
  network?: string;
  last4?: string;
  /** Printed on a banknote. */
  currency?: Currency;
  /** A strip for lists and the collapsed wallet; the whole object when open. */
  size?: MethodFaceSize;
  /** A save attempt found a problem on this method. */
  invalid?: boolean;
}

/** What a face prints, already normalised. */
export interface FaceText {
  size: MethodFaceSize;
  /** The alias, or a muted prompt when there isn't one yet. */
  title: string;
  untitled: boolean;
  typeLabel: string;
  network?: string;
  last4?: string;
  currency?: Currency;
}

/**
 * What goes where on a face. Every kind fills the same slots, and
 * FaceLayout alone decides where they sit — so a check, a card and a
 * banknote line up the same way.
 */
export interface FaceSlots {
  emblem: ReactNode;
  title: string;
  muted: boolean;
  /** Compact: the line under the title. */
  meta?: string;
  /** Compact: the right-hand column. */
  aside?: ReactNode;
  /** Full: top right. */
  corner?: string;
  /** Full: the line under the emblem (a card's number, a check's pay-to line). */
  detail?: ReactNode;
  /** Full: bottom left. */
  footer?: ReactNode;
  /** Full: bottom right (a network mark, a currency, a signature line). */
  mark?: ReactNode;
}
