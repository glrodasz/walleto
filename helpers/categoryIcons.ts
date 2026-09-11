import type { Domain, IconKey } from "../types";

/** The seeded defaults (data/defaultCategories.json) and their icons. */
const BY_NAME: Record<string, IconKey> = {
  salary: "briefcase",
  rent: "home",
  pension: "landmark",
  "side projects": "zap",
  extra: "gift",
  "home & family": "family",
  subscriptions: "subscriptions",
  credits: "credit-card",
  insurances: "shield",
  variable: "shuffle",
  crypto: "bitcoin",
  banking: "building",
  "real estate": "home",
  "emergency fund": "lifebuoy",
};

/** Substrings that decide an icon for names the user typed. First match wins. */
const BY_KEYWORD: [string, IconKey][] = [
  ["mortgage", "landmark"],
  ["loan", "credit-card"],
  ["credit", "credit-card"],
  ["insurance", "shield"],
  ["subscription", "subscriptions"],
  ["stream", "subscriptions"],
  ["software", "subscriptions"],
  ["home", "home"],
  ["house", "home"],
  ["rent", "home"],
  ["family", "family"],
  ["kid", "family"],
  ["child", "family"],
  ["pet", "heart"],
  ["health", "heart"],
  ["medical", "heart"],
  ["grocer", "cart"],
  ["shop", "cart"],
  ["market", "cart"],
  ["food", "utensils"],
  ["restaurant", "utensils"],
  ["dining", "utensils"],
  ["car", "car"],
  ["fuel", "car"],
  ["transport", "car"],
  ["travel", "plane"],
  ["trip", "plane"],
  ["flight", "plane"],
  ["phone", "phone"],
  ["mobile", "phone"],
  ["internet", "zap"],
  ["utilit", "zap"],
  ["electric", "zap"],
  ["energy", "zap"],
  ["gift", "gift"],
  ["book", "book"],
  ["education", "book"],
  ["course", "book"],
  ["school", "book"],
  ["salary", "briefcase"],
  ["work", "briefcase"],
  ["freelance", "briefcase"],
  ["invoice", "briefcase"],
  ["crypto", "bitcoin"],
  ["bitcoin", "bitcoin"],
  ["stock", "chart"],
  ["fund", "chart"],
  ["etf", "chart"],
  ["pension", "landmark"],
  ["retire", "landmark"],
  ["bank", "building"],
  ["saving", "piggy"],
  ["emergency", "lifebuoy"],
  ["cash", "wallet"],
  ["wallet", "wallet"],
];

const DOMAIN_FALLBACK: Record<Domain, IconKey> = {
  INCOME: "coins",
  EXPENSE: "tag",
  INVESTMENT: "chart",
  SAVING: "piggy",
};

/** The icon a category shows when the user has not picked one. */
export function defaultIconFor(name: string, domain: Domain): IconKey {
  const key = name.trim().toLowerCase();
  const exact = BY_NAME[key];
  if (exact) return exact;
  for (const [needle, icon] of BY_KEYWORD) if (key.includes(needle)) return icon;
  return DOMAIN_FALLBACK[domain];
}

/** A category's own pick, or the default for its name. The one rule every renderer uses. */
export function iconFor(category: { icon?: IconKey; name: string; domain: Domain }): IconKey {
  return category.icon ?? defaultIconFor(category.name, category.domain);
}
