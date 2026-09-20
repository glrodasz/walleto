import type { Category, Domain } from "../../types";
import { monthsAgo, ts, STORY_USER_ID } from "./time";

const created = ts(monthsAgo(9));

function cat(id: string, domain: Domain, name: string, extra: Partial<Category> = {}): Category {
  return { id, userId: STORY_USER_ID, domain, name, isDefault: true, createdAt: created, ...extra };
}

/** Default categories per domain (data/defaultCategories.json) plus a few children. */
export const STORY_CATEGORIES: Category[] = [
  cat("cat-income-salary", "INCOME", "Salary", { icon: "briefcase" }),
  cat("cat-income-rent", "INCOME", "Rent", { icon: "home" }),
  cat("cat-income-pension", "INCOME", "Pension"),
  cat("cat-income-side", "INCOME", "Side projects", { icon: "zap" }),
  cat("cat-income-extra", "INCOME", "Extra"),

  cat("cat-expense-home", "EXPENSE", "Home & Family", { icon: "home" }),
  cat("cat-expense-subs", "EXPENSE", "Subscriptions", { icon: "subscriptions" }),
  cat("cat-expense-credits", "EXPENSE", "Credits", { icon: "credit-card" }),
  cat("cat-expense-insurance", "EXPENSE", "Insurances", { icon: "shield" }),
  cat("cat-expense-variable", "EXPENSE", "Variable", { icon: "shuffle" }),
  cat("cat-expense-groceries", "EXPENSE", "Groceries", {
    icon: "cart",
    isDefault: false,
    parentId: "cat-expense-variable",
  }),
  cat("cat-expense-streaming", "EXPENSE", "Streaming", {
    isDefault: false,
    parentId: "cat-expense-subs",
  }),
  cat("cat-expense-travel", "EXPENSE", "Travel", {
    icon: "plane",
    isDefault: false,
    hiddenFromChart: true,
  }),

  cat("cat-investment-crypto", "INVESTMENT", "Crypto", { icon: "bitcoin" }),
  cat("cat-investment-banking", "INVESTMENT", "Banking", { icon: "landmark" }),
  cat("cat-investment-realestate", "INVESTMENT", "Real estate", { icon: "building" }),

  cat("cat-saving-banking", "SAVING", "Banking", { icon: "piggy" }),
  cat("cat-saving-emergency", "SAVING", "Emergency fund", { icon: "lifebuoy" }),

  cat("cat-debt-cards", "DEBT", "Credit cards", { icon: "credit-card" }),
  cat("cat-debt-loans", "DEBT", "Loans", { icon: "credit-card" }),
  cat("cat-debt-mortgage", "DEBT", "Mortgage", { icon: "landmark" }),
  cat("cat-debt-friends", "DEBT", "Friends & family", { icon: "family" }),
];

export function categoriesFor(domain?: Domain): Category[] {
  return domain ? STORY_CATEGORIES.filter((c) => c.domain === domain) : STORY_CATEGORIES;
}

export const categoryById = (id: string) => STORY_CATEGORIES.find((c) => c.id === id);
