import { useEffect } from "react";
import type { Preview } from "@storybook/nextjs";
import { UserProvider } from "@auth0/nextjs-auth0/client";
import { sb } from "storybook/test";
import { PreferencesProvider } from "../hooks/PreferencesProvider";
import { STORY_USER } from "../stories/fixtures/user";
import { resetStoryMocks } from "../stories/fixtures/mocks";
import "../styles/globals.css";

// Every module that talks to Firestore, Firebase Auth or the API routes is
// replaced by its `__mocks__` sibling (hooks/__mocks__, firebase/__mocks__).
// Stories then override single hooks with `mocked(useX).mockReturnValue(...)`.
sb.mock(import("../firebase/client.ts"));
sb.mock(import("../hooks/useFirebaseAuth.ts"));
sb.mock(import("../hooks/useUserDoc.ts"));
sb.mock(import("../hooks/useExchangeRates.ts"));
sb.mock(import("../hooks/useCategories.ts"));
sb.mock(import("../hooks/useTags.ts"));
sb.mock(import("../hooks/usePaymentMethods.ts"));
sb.mock(import("../hooks/useAccounts.ts"));
sb.mock(import("../hooks/useRecurrentTransactions.ts"));
sb.mock(import("../hooks/useDomainTransactions.ts"));
sb.mock(import("../hooks/useTransactions.ts"));
sb.mock(import("../hooks/useInvestmentValuations.ts"));
sb.mock(import("../hooks/useMaterialize.ts"));
sb.mock(import("../features/dashboard/hooks/useUpcomingItems.ts"));

type Theme = "light" | "dark";

/** Mirrors the boot script in pages/_document.tsx: the palette hangs off <html data-theme>. */
function ThemeSync({ theme }: { theme: Theme }) {
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  return null;
}

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Colour palette (data-theme on <html>)",
      toolbar: {
        title: "Theme",
        icon: "mirror",
        items: [
          { value: "light", title: "Light", icon: "sun" },
          { value: "dark", title: "Dark", icon: "moon" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: "light",
  },
  parameters: {
    // globals.css paints the body (backdrop art + ambient light), so the
    // backgrounds toolbar would only fight it.
    backgrounds: { disable: true },
    layout: "padded",
    nextjs: {
      router: { pathname: "/", asPath: "/", query: {} },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    options: {
      storySort: {
        order: ["Introduction", "Atoms", "Molecules", "Organisms", "Templates"],
      },
    },
  },
  beforeEach() {
    resetStoryMocks();
  },
  decorators: [
    (Story, { globals }) => (
      // Same provider stack as pages/_app.tsx minus ThemeProvider / MonthProvider,
      // which need the router and Firestore; useSelectedMonth falls back to
      // the current month on its own and the theme comes from the toolbar.
      <UserProvider user={STORY_USER}>
        <PreferencesProvider>
          <ThemeSync theme={(globals.theme as Theme) ?? "light"} />
          <div style={{ minHeight: "100%", fontFamily: "var(--font-sans)" }}>
            <Story />
          </div>
        </PreferencesProvider>
      </UserProvider>
    ),
  ],
};

export default preview;
