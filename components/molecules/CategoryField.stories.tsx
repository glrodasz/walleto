import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { CategoryField } from "./CategoryField";
import { boxed } from "../../stories/decorators";
import { categoriesFor } from "../../stories/fixtures";

function Controlled(props: React.ComponentProps<typeof CategoryField>) {
  const [value, setValue] = useState(props.value);
  return <CategoryField {...props} value={value} onChange={setValue} />;
}

const meta = {
  title: "Molecules/CategoryField",
  component: CategoryField,
  tags: ["autodocs"],
  args: {
    categories: categoriesFor("EXPENSE"),
    value: "cat-expense-home",
    onChange: fn(),
    createCategory: fn(async () => "cat-new"),
    newLabel: "New expense category",
    onError: fn(),
  },
  render: (args) => <Controlled {...args} />,
  decorators: [boxed(360)],
} satisfies Meta<typeof CategoryField>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Root categories only; "Create…" opens the combobox with an icon picker. */
export const Expense: Story = {};
export const Income: Story = {
  args: {
    categories: categoriesFor("INCOME"),
    value: "cat-income-salary",
    newLabel: "New income category",
  },
};
export const Unset: Story = { args: { value: "" } };
export const Disabled: Story = { args: { disabled: true } };
