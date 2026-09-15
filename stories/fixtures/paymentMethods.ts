import type { PaymentMethod } from "../../types";
import { monthsAgo, ts, STORY_USER_ID } from "./time";

const created = ts(monthsAgo(9));

/** The demo profile's methods (data/testSeedData.json) with ids. */
export const STORY_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "pm-chase",
    userId: STORY_USER_ID,
    name: "Chase Sapphire",
    type: "CREDIT_CARD",
    network: "Visa",
    last4: "4242",
    currencies: ["USD"],
    defaultCurrency: "USD",
    createdAt: created,
  },
  {
    id: "pm-bancolombia",
    userId: STORY_USER_ID,
    name: "Bancolombia Débito",
    type: "DEBIT_CARD",
    network: "Mastercard",
    last4: "8817",
    currencies: ["COP"],
    defaultCurrency: "COP",
    createdAt: created,
  },
  {
    id: "pm-nu",
    userId: STORY_USER_ID,
    name: "Nu",
    type: "CREDIT_CARD",
    network: "Mastercard",
    last4: "3391",
    currencies: ["COP"],
    defaultCurrency: "COP",
    createdAt: created,
  },
  {
    id: "pm-wise",
    userId: STORY_USER_ID,
    name: "Wise",
    type: "DIGITAL_WALLET",
    network: "Wise",
    currencies: ["USD", "EUR", "COP"],
    defaultCurrency: "USD",
    createdAt: created,
  },
  {
    id: "pm-revolut",
    userId: STORY_USER_ID,
    name: "Revolut",
    type: "DIGITAL_WALLET",
    network: "Revolut",
    currencies: ["EUR", "SEK"],
    defaultCurrency: "EUR",
    createdAt: created,
  },
  {
    id: "pm-cash",
    userId: STORY_USER_ID,
    name: "Efectivo",
    type: "CASH",
    currencies: ["COP"],
    defaultCurrency: "COP",
    createdAt: created,
  },
];
