import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { KebabMenu } from "./KebabMenu";
import { Card } from "../atoms/Card";
import { ListItem, ListItems } from "./ListItem";

const meta = {
  title: "Molecules/KebabMenu",
  component: KebabMenu,
  tags: ["autodocs"],
  args: {
    "aria-label": "Actions for Netflix",
    actions: [
      { label: "Edit", onSelect: fn() },
      { label: "Mark as paid", onSelect: fn() },
      { label: "Hide from dashboard", onSelect: fn() },
      { label: "Stop", onSelect: fn(), danger: true },
    ],
  },
  parameters: { layout: "centered" },
} satisfies Meta<typeof KebabMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Click the trigger: the menu portals to body so it escapes any glass card. */
export const Default: Story = {};
export const WithDisabled: Story = {
  args: {
    actions: [
      { label: "Edit", onSelect: fn() },
      { label: "Mark as paid", onSelect: fn(), disabled: true },
      { label: "Delete", onSelect: fn(), danger: true },
    ],
  },
};

/** Inside a row of a card, where it must rank above later cards. */
export const InARow: Story = {
  parameters: { layout: "padded" },
  render: (args) => (
    <div style={{ maxWidth: 520 }}>
      <Card>
        <ListItems>
          <ListItem
            name="Netflix"
            meta="Sep 12 · Monthly · Chase 4242"
            amount="$15.49"
            trailing={<KebabMenu {...args} />}
          />
          <ListItem
            name="Spotify Family"
            meta="Sep 18 · Monthly · Revolut"
            amount="€17.99"
            trailing={<KebabMenu {...args} />}
          />
        </ListItems>
      </Card>
    </div>
  ),
};
