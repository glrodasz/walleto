import type { Meta, StoryObj } from "@storybook/nextjs";
import { Badge } from "./Badge";
import type { BadgeTone } from "./Badge";
import { Repeat, Info } from "./Icons";

const TONES: BadgeTone[] = ["neutral", "success", "warning", "danger", "info"];

const meta = {
  title: "Atoms/Badge",
  component: Badge,
  tags: ["autodocs"],
  args: { children: "Recurring", variant: "solid", tone: "neutral" },
  argTypes: {
    variant: { control: "radio", options: ["solid", "outline"] },
    tone: { control: "select", options: TONES },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Solid: Story = {};
export const Outline: Story = { args: { variant: "outline", tone: "info", children: "Alpha" } };
export const Caps: Story = {
  args: { variant: "outline", tone: "warning", caps: true, children: "Staging" },
};
export const WithIcon: Story = { args: { icon: <Repeat size={12} />, children: "Monthly" } };
export const CustomColor: Story = {
  args: { color: "var(--domain-saving)", icon: <Info size={12} />, children: "Pocket" },
};

/** Every tone in both variants. */
export const Gallery: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 12 }}>
      {(["solid", "outline"] as const).map((variant) => (
        <div key={variant} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {TONES.map((tone) => (
            <Badge key={tone} variant={variant} tone={tone}>
              {tone}
            </Badge>
          ))}
        </div>
      ))}
    </div>
  ),
};
