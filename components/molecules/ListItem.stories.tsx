import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { ListItem, ListItems } from "./ListItem";
import { IconDisc } from "./IconDisc";
import { KebabMenu } from "./KebabMenu";
import { Badge } from "../atoms/Badge";
import { CategoryIcon } from "../atoms/CategoryIcon";
import { Card } from "../atoms/Card";
import { boxed } from "../../stories/decorators";

const meta = {
  title: "Molecules/ListItem",
  component: ListItem,
  tags: ["autodocs"],
  args: {
    name: "Groceries",
    meta: "Sep 6 · Twice a month · Bancolombia 8817",
    amount: "$219.51",
    amountMeta: "charged COP 900,000",
  },
  decorators: [
    (Story) => (
      <Card>
        <ListItems>
          <Story />
        </ListItems>
      </Card>
    ),
    boxed(560),
  ],
} satisfies Meta<typeof ListItem>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The canonical row: name and facts on the left, money on the right. */
export const Default: Story = {};

export const EverySlot: Story = {
  args: {
    leading: (
      <IconDisc domain="EXPENSE">
        <CategoryIcon category={{ name: "Groceries", domain: "EXPENSE", icon: "cart" }} />
      </IconDisc>
    ),
    badges: (
      <>
        <Badge tone="info">Family</Badge>
        <Badge variant="outline">Recurring</Badge>
      </>
    ),
    note: "Two big shops a month, cash for the market.",
    progress: { ratio: 0.62, color: "var(--domain-expense)", label: "62% of the month's plan" },
    trailing: <KebabMenu actions={[{ label: "Edit", onSelect: fn() }]} />,
  },
};

export const Clickable: Story = { args: { onClick: fn(), name: "Home & Family" } };
export const Link: Story = { args: { href: "/expenses", name: "Expenses" } };
/** Hidden or stopped items fade but stay listed. */
export const Muted: Story = {
  args: { muted: true, badges: <Badge variant="outline">Hidden</Badge> },
};
export const NoAmount: Story = { args: { amount: undefined, amountMeta: undefined } };

/** Several rows in one list. */
export const List: Story = {
  render: () => (
    <>
      <ListItem name="Rent" meta="Sep 1 · Monthly · Chase 4242" amount="$1,650.00" onClick={fn()} />
      <ListItem
        name="Netflix"
        meta="Sep 12 · Monthly"
        amount="$15.49"
        badges={<Badge tone="success">Paid</Badge>}
      />
      <ListItem
        name="Car insurance"
        meta="Sep 14 · Yearly"
        amount="$120.00"
        amountMeta="$1,440.00 / year"
      />
      <ListItem
        name="Gym"
        meta="Sep 2 · Monthly"
        amount="$45.00"
        muted
        badges={<Badge variant="outline">Hidden</Badge>}
      />
    </>
  ),
};
