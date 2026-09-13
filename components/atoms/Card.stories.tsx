import type { Meta, StoryObj } from "@storybook/nextjs";
import { Card } from "./Card";
import { SectionTitle } from "./SectionTitle";
import { Amount } from "./Amount";

const DOMAINS = ["INCOME", "EXPENSE", "INVESTMENT", "SAVING"] as const;

const meta = {
  title: "Atoms/Card",
  component: Card,
  tags: ["autodocs"],
  args: {
    padding: "md",
    children: (
      <>
        <SectionTitle title="Planned monthly expenses" subtitle="What repeats every month" />
        <Amount value={2840.5} currency="USD" size="lg" />
      </>
    ),
  },
  argTypes: {
    tint: { control: "select", options: [undefined, ...DOMAINS] },
    padding: { control: "radio", options: ["sm", "md"] },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 420 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The plain glass surface every panel is made of. */
export const Default: Story = {};
export const SmallPadding: Story = { args: { padding: "sm" } };

/** One tint per domain. */
export const Tints: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 12 }}>
      {DOMAINS.map((d) => (
        <Card key={d} tint={d}>
          <SectionTitle title={d} />
        </Card>
      ))}
    </div>
  ),
};
