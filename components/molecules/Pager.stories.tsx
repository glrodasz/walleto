import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { Pager } from "./Pager";

function Controlled(props: React.ComponentProps<typeof Pager>) {
  const [page, setPage] = useState(props.page);
  return <Pager {...props} page={page} onChange={setPage} />;
}

const meta = {
  title: "Molecules/Pager",
  component: Pager,
  tags: ["autodocs"],
  args: { page: 1, pageCount: 4, onChange: fn() },
  render: (args) => <Controlled {...args} />,
} satisfies Meta<typeof Pager>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FirstPage: Story = {};
export const MiddlePage: Story = { args: { page: 2 } };
export const LastPage: Story = { args: { page: 4 } };
/** A single page still renders, so lists keep a stable footer. */
export const SinglePage: Story = { args: { pageCount: 1 } };
