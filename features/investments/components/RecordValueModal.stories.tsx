import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { RecordValueModal } from "./RecordValueModal";
import { Button } from "../../../components/atoms/Button";

function Launcher(props: React.ComponentProps<typeof RecordValueModal>) {
  const [open, setOpen] = useState(props.open);
  return (
    <div style={{ padding: 24 }}>
      <Button onClick={() => setOpen(true)}>Record a value</Button>
      <RecordValueModal {...props} open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

/** The "+" flow for account value: pick the account, then record. Accounts come from the mocked hook. */
const meta = {
  title: "Organisms/Investments/RecordValueModal",
  component: RecordValueModal,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  args: { open: true, domain: "INVESTMENT", onClose: fn() },
  render: (args) => <Launcher {...args} />,
} satisfies Meta<typeof RecordValueModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Investment: Story = {};
export const Saving: Story = { args: { domain: "SAVING" } };
export const Debt: Story = { args: { domain: "DEBT" } };
