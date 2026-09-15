import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { EditMethodModal } from "./EditMethodModal";
import { Button } from "../../../components/atoms/Button";
import { STORY_PAYMENT_METHODS } from "../../../stories/fixtures";
import type { PaymentMethod } from "../../../types";

function Launcher(props: React.ComponentProps<typeof EditMethodModal>) {
  const [method, setMethod] = useState<PaymentMethod | null>(props.method);
  return (
    <div style={{ padding: 24 }}>
      <Button onClick={() => setMethod(props.method)}>Edit method</Button>
      <EditMethodModal {...props} method={method} onClose={() => setMethod(null)} />
    </div>
  );
}

const meta = {
  title: "Organisms/Methods/EditMethodModal",
  component: EditMethodModal,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  args: { method: STORY_PAYMENT_METHODS[0], onClose: fn() },
  render: (args) => <Launcher {...args} />,
} satisfies Meta<typeof EditMethodModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CreditCard: Story = {};
export const DigitalWallet: Story = { args: { method: STORY_PAYMENT_METHODS[3] } };
export const Cash: Story = { args: { method: STORY_PAYMENT_METHODS[5] } };
