import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { Modal } from "./Modal";
import { Button } from "../atoms/Button";
import { TextField } from "../atoms/TextField";
import { Select } from "../atoms/Select";

function Launcher(props: React.ComponentProps<typeof Modal>) {
  const [open, setOpen] = useState(props.open);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open modal</Button>
      <Modal {...props} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

const FORM = (
  <div style={{ display: "grid", gap: 14 }}>
    <TextField label="Name" defaultValue="Netflix" />
    <TextField label="Amount" prefix="$" align="right" defaultValue="15.49" />
    <Select
      label="Frequency"
      options={[
        { value: "MONTHLY", label: "Monthly" },
        { value: "YEARLY", label: "Yearly" },
      ]}
      defaultValue="MONTHLY"
    />
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
      <Button variant="ghost">Cancel</Button>
      <Button>Save</Button>
    </div>
  </div>
);

const meta = {
  title: "Molecules/Modal",
  component: Modal,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  args: { open: true, title: "Edit item", onClose: fn(), children: FORM },
  render: (args) => <Launcher {...args} />,
  decorators: [
    (Story) => (
      <div style={{ padding: 24, minHeight: "100vh" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Centered dialog on desktop. */
export const Open: Story = {};
export const Closed: Story = { args: { open: false } };
/** Under 768px it becomes a bottom sheet. */
export const BottomSheet: Story = {
  globals: { viewport: { value: "mobile1", isRotated: false } },
};
export const LongContent: Story = {
  args: {
    title: "Terms",
    children: (
      <div style={{ display: "grid", gap: 12 }}>
        {Array.from({ length: 12 }, (_, i) => (
          <p key={i} style={{ margin: 0, color: "var(--fg-1)" }}>
            Paragraph {i + 1}. The body scrolls inside the sheet; the header and the sticky action
            row stay in view.
          </p>
        ))}
        <div
          style={{
            position: "sticky",
            bottom: 0,
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
          }}
        >
          <Button>Done</Button>
        </div>
      </div>
    ),
  },
};
