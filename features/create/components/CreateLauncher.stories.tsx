import type { Meta, StoryObj } from "@storybook/nextjs";
import { CreateLauncher } from "./CreateLauncher";

/**
 * The floating "+" and its sheet: one-off payment, recurring item, or an
 * account value. It is fixed to the bottom-right of the viewport.
 */
const meta = {
  title: "Organisms/Create/CreateLauncher",
  component: CreateLauncher,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div style={{ minHeight: "100vh", padding: 24, color: "var(--fg-2)" }}>
        Tap the + in the corner.
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CreateLauncher>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Asks which domain first. */
export const AnyDomain: Story = {};
/** On a domain page the domain question is skipped. */
export const ExpensesPage: Story = { args: { domain: "EXPENSE" } };
export const InvestmentsPage: Story = { args: { domain: "INVESTMENT" } };
export const Mobile: Story = { globals: { viewport: { value: "mobile1", isRotated: false } } };
