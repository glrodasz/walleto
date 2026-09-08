import { z } from "zod";
import { CURRENCIES } from "../constants";

export const CurrencySchema = z.enum(CURRENCIES);

export const DomainSchema = z.enum(["INCOME", "EXPENSE", "INVESTMENT", "SAVING"]);

export const FrequencySchema = z.enum([
  "ONE_TIME",
  "WEEKLY",
  "BIWEEKLY",
  "MONTHLY",
  "QUARTERLY",
  "YEARLY",
]);

export const PaymentMethodTypeSchema = z.enum([
  "CREDIT_CARD",
  "DEBIT_CARD",
  "BANK_TRANSFER",
  "DIGITAL_WALLET",
  "CASH",
  "CRYPTO_WALLET",
  "OTHER",
]);

export const RecurrentTransactionTypeSchema = z.enum([
  "SUBSCRIPTION",
  "SALARY",
  "SAVINGS_TRANSFER",
  "LOAN_PAYMENT",
  "UTILITY",
  "OTHER",
]);

export const TransactionStatusSchema = z.enum(["PENDING", "PAID", "SKIPPED"]);

/**
 * chargedAmount ⇔ chargedCurrency travel together: both set, both cleared
 * (null, on update schemas), or both absent. A charged pair in the item's own
 * currency is meaningless — it must record what a *different* currency cost.
 */
function refineChargedPair(
  v: {
    chargedAmount?: number | null;
    chargedCurrency?: string | null;
    currency?: string;
  },
  ctx: z.RefinementCtx
) {
  const amountSet = v.chargedAmount !== undefined;
  const currencySet = v.chargedCurrency !== undefined;
  const halfCleared = amountSet && (v.chargedAmount === null) !== (v.chargedCurrency === null);
  if (amountSet !== currencySet || halfCleared) {
    ctx.addIssue({
      code: "custom",
      message: "chargedAmount and chargedCurrency must be provided (or cleared) together",
      path: ["chargedAmount"],
    });
  }
  if (v.chargedCurrency && v.currency && v.chargedCurrency === v.currency) {
    ctx.addIssue({
      code: "custom",
      message: "chargedCurrency must differ from currency",
      path: ["chargedCurrency"],
    });
  }
}

export const CategoryInputSchema = z.object({
  domain: DomainSchema,
  name: z.string().min(1).max(40).trim(),
  parentId: z.string().optional(),
});

export const CategoryUpdateSchema = z.object({
  name: z.string().min(1).max(40).trim().optional(),
  archived: z.boolean().optional(),
});

export const PaymentMethodInputSchema = z.object({
  name: z.string().min(1).max(60).trim(),
  type: PaymentMethodTypeSchema,
  // Optional during onboarding — the API defaults it to the user's mainCurrency.
  currencies: z.array(CurrencySchema).min(1).optional(),
  defaultCurrency: CurrencySchema.optional(),
  last4: z
    .string()
    .regex(/^\d{4}$/, "Must be exactly 4 digits")
    .optional(),
  // Card network (Visa, Mastercard...) or wallet provider (Wise, PayPal...).
  // Free text — suggested via a Combobox, not enforced against a fixed list.
  network: z.string().max(40).trim().optional(),
});

export const PaymentMethodUpdateSchema = z.object({
  name: z.string().min(1).max(60).trim().optional(),
  type: PaymentMethodTypeSchema.optional(),
  currencies: z.array(CurrencySchema).min(1).optional(),
  defaultCurrency: CurrencySchema.optional(),
  last4: z
    .string()
    .regex(/^\d{4}$/, "Must be exactly 4 digits")
    .optional(),
  network: z.string().max(40).trim().optional(),
  archived: z.boolean().optional(),
});

export const RecurrentTransactionInputSchema = z
  .object({
    domain: DomainSchema,
    categoryId: z.string().min(1),
    name: z.string().min(1).max(100).trim(),
    amount: z.number().positive(),
    currency: CurrencySchema,
    chargedAmount: z.number().positive().optional(),
    chargedCurrency: CurrencySchema.optional(),
    frequency: FrequencySchema,
    secondDayOfMonth: z.number().int().min(1).max(31).optional(),
    type: RecurrentTransactionTypeSchema.optional(),
    paymentMethodId: z.string().optional(),
    startDate: z.iso.datetime().optional(),
    active: z.boolean().optional(),
  })
  .superRefine(refineChargedPair);

export const RecurrentTransactionUpdateSchema = z
  .object({
    name: z.string().min(1).max(100).trim().optional(),
    amount: z.number().positive().optional(),
    currency: CurrencySchema.optional(),
    // null clears the field (FieldValue.delete() server-side).
    chargedAmount: z.number().positive().nullable().optional(),
    chargedCurrency: CurrencySchema.nullable().optional(),
    frequency: FrequencySchema.optional(),
    secondDayOfMonth: z.number().int().min(1).max(31).nullable().optional(),
    categoryId: z.string().min(1).optional(),
    paymentMethodId: z.string().min(1).nullable().optional(),
    type: RecurrentTransactionTypeSchema.nullable().optional(),
    startDate: z.iso.datetime().optional(),
    active: z.boolean().optional(),
  })
  .superRefine((v, ctx) => {
    if (Object.keys(v).length === 0) {
      ctx.addIssue({ code: "custom", message: "At least one field is required" });
    }
    refineChargedPair(v, ctx);
  });

export const TransactionInputSchema = z
  .object({
    domain: DomainSchema,
    categoryId: z.string().min(1),
    name: z.string().min(1).max(100).trim(),
    amount: z.number().positive(),
    currency: CurrencySchema,
    chargedAmount: z.number().positive().optional(),
    chargedCurrency: CurrencySchema.optional(),
    paymentMethodId: z.string().optional(),
    occurredAt: z.iso.datetime(),
    status: TransactionStatusSchema.optional(),
  })
  .superRefine(refineChargedPair);

export const TransactionUpdateSchema = z
  .object({
    status: TransactionStatusSchema.optional(),
    categoryId: z.string().min(1).optional(),
    name: z.string().min(1).max(100).trim().optional(),
    amount: z.number().positive().optional(),
    currency: CurrencySchema.optional(),
    occurredAt: z.iso.datetime().optional(),
    chargedAmount: z.number().positive().nullable().optional(),
    chargedCurrency: CurrencySchema.nullable().optional(),
    paymentMethodId: z.string().min(1).nullable().optional(),
  })
  .superRefine((v, ctx) => {
    if (Object.keys(v).length === 0) {
      ctx.addIssue({ code: "custom", message: "At least one field is required" });
    }
    refineChargedPair(v, ctx);
  });

export const InvestmentValuationInputSchema = z.object({
  categoryId: z.string().min(1),
  asOf: z.iso.datetime(),
  gainPct: z.number().finite(),
  value: z.number().min(0),
  costBasis: z.number().min(0),
  currency: CurrencySchema,
  note: z.string().max(200).trim().optional(),
});

export const InvestmentValuationUpdateSchema = z
  .object({
    asOf: z.iso.datetime().optional(),
    gainPct: z.number().finite().optional(),
    value: z.number().min(0).optional(),
    costBasis: z.number().min(0).optional(),
    note: z.string().max(200).trim().nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "At least one field is required" });

export const UserUpdateSchema = z
  .object({
    mainCurrency: CurrencySchema.optional(),
    displayCurrency: CurrencySchema.optional(),
    onboardingCompleted: z.boolean().optional(),
    onboardingMode: z.enum(["MAGIC", "ASSISTED"]).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "At least one field is required",
  });

export type CategoryInput = z.infer<typeof CategoryInputSchema>;
export type CategoryUpdate = z.infer<typeof CategoryUpdateSchema>;
export type PaymentMethodInput = z.infer<typeof PaymentMethodInputSchema>;
export type PaymentMethodUpdate = z.infer<typeof PaymentMethodUpdateSchema>;
export type RecurrentTransactionInput = z.infer<typeof RecurrentTransactionInputSchema>;
export type RecurrentTransactionUpdate = z.infer<typeof RecurrentTransactionUpdateSchema>;
export type TransactionInput = z.infer<typeof TransactionInputSchema>;
export type TransactionUpdate = z.infer<typeof TransactionUpdateSchema>;
export type InvestmentValuationInput = z.infer<typeof InvestmentValuationInputSchema>;
export type InvestmentValuationUpdate = z.infer<typeof InvestmentValuationUpdateSchema>;
export type UserUpdate = z.infer<typeof UserUpdateSchema>;
