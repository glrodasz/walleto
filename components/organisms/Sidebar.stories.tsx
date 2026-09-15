import type { Meta, StoryObj } from "@storybook/nextjs";
import { Sidebar } from "./Sidebar";

const meta = {
  title: "Organisms/Sidebar",
  component: Sidebar,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Story />
        <div style={{ flex: 1, padding: 32, color: "var(--fg-2)" }}>Page content</div>
      </div>
    ),
  ],
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Dashboard active. The desktop pane and, under 768px, the bottom capsule. */
export const Dashboard: Story = {};

export const OnExpenses: Story = {
  parameters: { nextjs: { router: { pathname: "/expenses", asPath: "/expenses" } } },
};

/** A destination behind "More" marks that tab active. */
export const OnSettings: Story = {
  parameters: { nextjs: { router: { pathname: "/settings", asPath: "/settings" } } },
};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile1", isRotated: false } },
  parameters: { nextjs: { router: { pathname: "/incomes", asPath: "/incomes" } } },
};
