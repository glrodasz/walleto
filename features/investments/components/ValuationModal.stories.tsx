import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { ValuationModal } from "./ValuationModal";
import { Button } from "../../../components/atoms/Button";
import { STORY_VALUATIONS } from "../../../stories/fixtures";

function Launcher(props: React.ComponentProps<typeof ValuationModal>) {
  const [open, setOpen] = useState(props.open);
  return (
    <div style={{ padding: 24 }}>
      <Button onClick={() => setOpen(true)}>Record value</Button>
      <ValuationModal {...props} open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

const meta = {
  title: "Organisms/Investments/ValuationModal",
  component: ValuationModal,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  args: {
    open: true,
    domain: "INVESTMENT",
    selector: { accountId: "acc-coinbase" },
    name: "Coinbase",
    costBasis: 1200,
    currency: "USD",
    onClose: fn(),
  },
  render: (args) => <Launcher {...args} />,
} satisfies Meta<typeof ValuationModal>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Record what the account is worth now; gain and value stay in sync. */
export const New: Story = {};
export const Edit: Story = {
  args: { valuation: STORY_VALUATIONS.find((v) => v.id === "iv-coinbase-0") },
};
/** A debt records a balance owed — one field, opened on today's estimate. */
export const DebtBalance: Story = {
  args: {
    domain: "DEBT",
    selector: { accountId: "acc-visa" },
    name: "Visa Gold",
    costBasis: 2000,
    latestValue: 4210,
  },
};
