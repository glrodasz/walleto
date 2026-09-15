/**
 * Default implementations for every mocked data hook. The `__mocks__`
 * modules wrap these in `fn()` so a story can override one hook
 * (`mocked(useCategories).mockReturnValue(...)`), and `resetStoryMocks`
 * puts them back before each story.
 *
 * Results are memoised per argument so consumers with `useMemo` / effect
 * dependencies see stable references across renders.
 */
import type { AccountDomain, Domain } from "../../types";
import { accountsFor } from "./accounts";
import { categoriesFor } from "./categories";
import { STORY_PAYMENT_METHODS } from "./paymentMethods";
import { STORY_RATES } from "./rates";
import { recurrentFor, upcomingItems } from "./recurrent";
import { STORY_TAGS } from "./tags";
import { transactionsFor } from "./transactions";
import { STORY_USER_DOC } from "./user";
import { STORY_VALUATIONS } from "./valuations";

type Hooks = {
  useUserDoc: typeof import("../../hooks/useUserDoc").useUserDoc;
  useFirebaseAuth: typeof import("../../hooks/useFirebaseAuth").useFirebaseAuth;
  useExchangeRates: typeof import("../../hooks/useExchangeRates").useExchangeRates;
  useCategories: typeof import("../../hooks/useCategories").useCategories;
  useTags: typeof import("../../hooks/useTags").useTags;
  usePaymentMethods: typeof import("../../hooks/usePaymentMethods").usePaymentMethods;
  useAccounts: typeof import("../../hooks/useAccounts").useAccounts;
  useRecurrentTransactions: typeof import("../../hooks/useRecurrentTransactions").useRecurrentTransactions;
  useDomainTransactions: typeof import("../../hooks/useDomainTransactions").useDomainTransactions;
  useAllInvestmentValuations: typeof import("../../hooks/useInvestmentValuations").useAllInvestmentValuations;
  useMaterialize: typeof import("../../hooks/useMaterialize").useMaterialize;
  useUpcomingItems: typeof import("../../features/dashboard/hooks/useUpcomingItems").useUpcomingItems;
};

function memo<A extends unknown[], R>(key: (...args: A) => string, make: (...args: A) => R) {
  const cache = new Map<string, R>();
  return (...args: A): R => {
    const k = key(...args);
    let hit = cache.get(k);
    if (hit === undefined) {
      hit = make(...args);
      cache.set(k, hit);
    }
    return hit;
  };
}

/** A resolved write: the id a form would select after creating something. */
export const created = async () => "story-new-id";
export const done = async () => {};

const useUserDoc: Hooks["useUserDoc"] = memo(
  () => "user",
  () => ({ userDoc: STORY_USER_DOC, error: null, update: done })
);

const useFirebaseAuth: Hooks["useFirebaseAuth"] = memo(
  () => "auth",
  () => ({ ready: true, error: null })
);

const useExchangeRates: Hooks["useExchangeRates"] = memo(
  () => "rates",
  () => ({ rates: STORY_RATES, stale: false, loading: false, error: null })
);

const useCategories: Hooks["useCategories"] = memo(
  (domain?: Domain) => domain ?? "ALL",
  (domain?: Domain) => ({
    categories: categoriesFor(domain),
    loading: false,
    error: null,
    create: created,
    update: done,
    rename: done,
    remove: done,
  })
);

const useTags: Hooks["useTags"] = memo(
  () => "tags",
  () => ({
    tags: STORY_TAGS,
    loading: false,
    error: null,
    create: created,
    update: done,
    remove: done,
  })
);

const usePaymentMethods: Hooks["usePaymentMethods"] = memo(
  () => "methods",
  () => ({
    methods: STORY_PAYMENT_METHODS,
    loading: false,
    error: null,
    create: created,
    update: done,
    remove: done,
  })
);

const useAccounts: Hooks["useAccounts"] = memo(
  (domain: AccountDomain | "ALL" | null) => String(domain),
  (domain: AccountDomain | "ALL" | null) => ({
    accounts: accountsFor(domain),
    loading: false,
    error: null,
    create: created,
    update: done,
    remove: done,
  })
);

const useRecurrentTransactions: Hooks["useRecurrentTransactions"] = memo(
  (domain?: Domain) => domain ?? "ALL",
  (domain?: Domain) => ({
    items: recurrentFor(domain),
    loading: false,
    error: null,
    create: created,
    update: done,
    remove: done,
  })
);

const useDomainTransactions: Hooks["useDomainTransactions"] = memo(
  (domain: Domain, startDate: Date) => `${domain}:${startDate.getTime()}`,
  (domain: Domain, startDate: Date) => ({
    transactions: transactionsFor(domain, startDate),
    loading: false,
    error: null,
  })
);

const useAllInvestmentValuations: Hooks["useAllInvestmentValuations"] = memo(
  () => "valuations",
  () => ({ valuations: STORY_VALUATIONS, loading: false, error: null })
);

const useMaterialize: Hooks["useMaterialize"] = () => {};

const useUpcomingItems: Hooks["useUpcomingItems"] = memo(
  (count?: number) => String(count ?? 5),
  (count?: number) => ({ items: upcomingItems(count), loading: false, error: null, markPaid: done })
);

export const hookDefaults: Hooks = {
  useUserDoc,
  useFirebaseAuth,
  useExchangeRates,
  useCategories,
  useTags,
  usePaymentMethods,
  useAccounts,
  useRecurrentTransactions,
  useDomainTransactions,
  useAllInvestmentValuations,
  useMaterialize,
  useUpcomingItems,
};

/** Shorthands for the states every list-like story wants to show. */
export const loadingState = { loading: true, error: null } as const;
export const errorState = {
  loading: false,
  error: new Error(
    "Missing or insufficient permissions. See https://console.firebase.google.com/project/storybook/firestore/rules"
  ),
} as const;
