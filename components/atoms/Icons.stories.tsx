import type { Meta, StoryObj } from "@storybook/nextjs";
import type { ComponentType } from "react";
import * as Icons from "./Icons";
import type { IconProps } from "./Icons";

const ALL = (Object.entries(Icons) as [string, unknown][]).filter(
  (entry): entry is [string, ComponentType<IconProps>] => typeof entry[1] === "function"
);

function Gallery({ size }: { size: number }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
        gap: 12,
        color: "var(--fg-1)",
        fontSize: 12,
      }}
    >
      {ALL.map(([name, Icon]) => (
        <div key={name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "var(--fg-0)", display: "inline-flex" }}>
            <Icon size={size} />
          </span>
          {name}
        </div>
      ))}
    </div>
  );
}

const meta = {
  title: "Atoms/Icons",
  component: Gallery,
  tags: ["autodocs"],
  args: { size: 20 },
  argTypes: { size: { control: { type: "range", min: 12, max: 40 } } },
} satisfies Meta<typeof Gallery>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every icon exported from components/atoms/Icons.tsx. */
export const All: Story = {};
