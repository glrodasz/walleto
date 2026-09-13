import type { Meta, StoryObj } from "@storybook/nextjs";
import { mocked } from "storybook/test";
import { DashboardPage } from "./DashboardPage";
import { useUserDoc } from "../../../hooks/useUserDoc";
import { useCategories } from "../../../hooks/useCategories";
import { useRecurrentTransactions } from "../../../hooks/useRecurrentTransactions";
import { useDomainTransactions } from "../../../hooks/useDomainTransactions";
import { useExchangeRates } from "../../../hooks/useExchangeRates";
import { useUpcomingItems } from "../hooks/useUpcomingItems";
import { errorState, hookDefaults, loadingState } from "../../../stories/fixtures/hookDefaults";
import { at, MOBILE, screen } from "../../../stories/templates";

/**
 * The home screen, exactly as pages/index.tsx renders it, over the mocked
 * data hooks: the monthly plan hero, a stat card per domain, the cash flow,
 * the top categories and the upcoming payments.
 */
const meta = {
  title: "Templates/Dashboard",
  component: DashboardPage,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen", ...at("/") },
  decorators: [screen],
} satisfies Meta<typeof DashboardPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Before the user doc and the first snapshots arrive. */
export const Loading: Story = {
  beforeEach: () => {
    mocked(useUserDoc).mockReturnValue({ ...hookDefaults.useUserDoc(), userDoc: null });
    mocked(useRecurrentTransactions).mockImplementation((d) => ({
      ...hookDefaults.useRecurrentTransactions(d),
      items: [],
      ...loadingState,
    }));
    mocked(useDomainTransactions).mockImplementation((d, s) => ({
      ...hookDefaults.useDomainTransactions(d, s),
      transactions: [],
      ...loadingState,
    }));
    mocked(useUpcomingItems).mockReturnValue({
      ...hookDefaults.useUpcomingItems(),
      items: [],
      ...loadingState,
    });
  },
};

/** A new user with nothing planned yet. */
export const Empty: Story = {
  beforeEach: () => {
    mocked(useRecurrentTransactions).mockImplementation((d) => ({
      ...hookDefaults.useRecurrentTransactions(d),
      items: [],
    }));
    mocked(useDomainTransactions).mockImplementation((d, s) => ({
      ...hookDefaults.useDomainTransactions(d, s),
      transactions: [],
    }));
    mocked(useUpcomingItems).mockReturnValue({ ...hookDefaults.useUpcomingItems(), items: [] });
  },
};

/** Rates never loaded: totals mix currencies and the page says so. */
export const FxUnavailable: Story = {
  beforeEach: () => {
    mocked(useExchangeRates).mockReturnValue({
      rates: null,
      stale: true,
      loading: false,
      error: null,
    });
  },
};

/** A Firestore error surfaces as an error state, never as an empty dashboard. */
export const Error: Story = {
  beforeEach: () => {
    mocked(useCategories).mockImplementation((d) => ({
      ...hookDefaults.useCategories(d),
      categories: [],
      ...errorState,
    }));
  },
};

export const Mobile: Story = { globals: MOBILE };
