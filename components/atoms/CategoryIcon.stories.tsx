import type { Meta, StoryObj } from "@storybook/nextjs";
import { CategoryIcon, CATEGORY_ICONS } from "./CategoryIcon";
import { ICON_KEYS } from "../../constants";
import type { IconKey } from "../../types";

const meta = {
  title: "Atoms/CategoryIcon",
  component: CategoryIcon,
  tags: ["autodocs"],
  args: { category: { name: "Groceries", domain: "EXPENSE", icon: "cart" }, size: 24 },
  argTypes: { size: { control: { type: "range", min: 12, max: 48 } } },
} satisfies Meta<typeof CategoryIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Picked: Story = {};
/** Without an explicit icon the name decides (helpers/categoryIcons). */
export const ByName: Story = { args: { category: { name: "Subscriptions", domain: "EXPENSE" } } };
export const UnknownName: Story = {
  args: { category: { name: "Something new", domain: "INCOME" } },
};

/** Every curated key from ICON_KEYS. */
export const AllKeys: Story = {
  render: () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
        gap: 12,
      }}
    >
      {ICON_KEYS.map((key) => {
        const Icon = CATEGORY_ICONS[key as IconKey];
        return (
          <div
            key={key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "var(--fg-1)",
              fontSize: 13,
            }}
          >
            <Icon size={20} /> {key}
          </div>
        );
      })}
    </div>
  ),
};
