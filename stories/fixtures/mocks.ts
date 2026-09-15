/**
 * Restores every mocked hook to its default fixture before each story, so
 * a `mockReturnValue` in one story's `beforeEach` never leaks into the next.
 * Imports resolve to the `__mocks__` modules through `sb.mock` in preview.tsx.
 */
import { mocked } from "storybook/test";
import { useUserDoc } from "../../hooks/useUserDoc";
import { useFirebaseAuth } from "../../hooks/useFirebaseAuth";
import { useExchangeRates } from "../../hooks/useExchangeRates";
import { useCategories } from "../../hooks/useCategories";
import { useTags } from "../../hooks/useTags";
import { usePaymentMethods } from "../../hooks/usePaymentMethods";
import { useAccounts } from "../../hooks/useAccounts";
import { useRecurrentTransactions } from "../../hooks/useRecurrentTransactions";
import { useDomainTransactions } from "../../hooks/useDomainTransactions";
import { useAllInvestmentValuations } from "../../hooks/useInvestmentValuations";
import { useMaterialize } from "../../hooks/useMaterialize";
import { useUpcomingItems } from "../../features/dashboard/hooks/useUpcomingItems";
import { hookDefaults } from "./hookDefaults";

export function resetStoryMocks() {
  mocked(useUserDoc).mockReset().mockImplementation(hookDefaults.useUserDoc);
  mocked(useFirebaseAuth).mockReset().mockImplementation(hookDefaults.useFirebaseAuth);
  mocked(useExchangeRates).mockReset().mockImplementation(hookDefaults.useExchangeRates);
  mocked(useCategories).mockReset().mockImplementation(hookDefaults.useCategories);
  mocked(useTags).mockReset().mockImplementation(hookDefaults.useTags);
  mocked(usePaymentMethods).mockReset().mockImplementation(hookDefaults.usePaymentMethods);
  mocked(useAccounts).mockReset().mockImplementation(hookDefaults.useAccounts);
  mocked(useRecurrentTransactions)
    .mockReset()
    .mockImplementation(hookDefaults.useRecurrentTransactions);
  mocked(useDomainTransactions).mockReset().mockImplementation(hookDefaults.useDomainTransactions);
  mocked(useAllInvestmentValuations)
    .mockReset()
    .mockImplementation(hookDefaults.useAllInvestmentValuations);
  mocked(useMaterialize).mockReset().mockImplementation(hookDefaults.useMaterialize);
  mocked(useUpcomingItems).mockReset().mockImplementation(hookDefaults.useUpcomingItems);
}
