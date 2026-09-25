import type { Meta, StoryObj } from "@storybook/nextjs";
import { PageLayout } from "./PageLayout";
import { Card } from "../atoms/Card";
import { SectionTitle } from "../atoms/SectionTitle";
import { EmptyState } from "../atoms/EmptyState";

const BODY = (
  <Card>
    <SectionTitle title="A section" subtitle="Cards stack in the main column" />
    <EmptyState title="Nothing here yet" description="This is where the page's content goes." />
  </Card>
);

/**
 * The app shell: sidebar, header with the display currency and month
 * controls, the main column, and the floating create button on mobile.
 * The month picker reads the current month without a MonthProvider.
 */
const meta = {
  title: "Organisms/PageLayout",
  component: PageLayout,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  args: {
    title: "Expenses",
    subtitle: "Track what you spend, see your patterns, and stay in control.",
    domain: "EXPENSE",
    children: BODY,
  },
} satisfies Meta<typeof PageLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: { nextjs: { router: { pathname: "/expenses", asPath: "/expenses" } } },
};
/** Settings has no month; the dashboard has no month either but keeps the currency. */
export const NoControls: Story = {
  args: {
    title: "Settings",
    subtitle: "Manage your preferences.",
    domain: undefined,
    hideMonth: true,
    hideCurrency: true,
  },
  parameters: { nextjs: { router: { pathname: "/settings", asPath: "/settings" } } },
};
export const CurrencyOnly: Story = {
  args: {
    title: "Good morning, Ada",
    subtitle: "Here's where your money stands.",
    domain: undefined,
    hideMonth: true,
  },
};
export const Mobile: Story = {
  globals: { viewport: { value: "mobile1", isRotated: false } },
  parameters: { nextjs: { router: { pathname: "/expenses", asPath: "/expenses" } } },
};
