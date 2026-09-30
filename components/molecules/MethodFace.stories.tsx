import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { MethodFace, MethodFaceButton } from "./MethodFace";
import { boxed } from "../../stories/decorators";

const meta = {
  title: "Molecules/MethodFace",
  component: MethodFace,
  tags: ["autodocs"],
  args: {
    type: "DEBIT_CARD",
    name: "Bancolombia Débito",
    network: "Mastercard",
    last4: "8817",
    size: "compact",
  },
  decorators: [boxed(420)],
} satisfies Meta<typeof MethodFace>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every kind, strip and full size — switch the theme in the toolbar for dark. */
const ALL = [
  { type: "CREDIT_CARD", name: "Chase Sapphire", network: "Visa", last4: "4242" },
  { type: "DEBIT_CARD", name: "Bancolombia Débito", network: "Mastercard", last4: "8817" },
  { type: "BANK_TRANSFER", name: "SEB", network: "Autogiro" },
  { type: "DIGITAL_WALLET", name: "Wise", network: "Wise" },
  { type: "CRYPTO_WALLET", name: "Ledger" },
  { type: "CASH", name: "Efectivo", currency: "COP" },
  { type: "OTHER", name: "Sodexo" },
  { type: "", name: "" },
] as const;

function Gallery({ size }: { size: "compact" | "full" }) {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      {ALL.map((m) => (
        <MethodFace key={m.type || "blank"} {...m} size={size} />
      ))}
    </div>
  );
}

export const Card: Story = {};
export const CardFull: Story = { args: { size: "full" } };
export const Check: Story = {
  args: { type: "BANK_TRANSFER", name: "SEB", network: "Autogiro", last4: undefined },
};
export const CheckFull: Story = { args: { ...Check.args, size: "full" } };
export const Phone: Story = {
  args: { type: "DIGITAL_WALLET", name: "Wise", network: "Wise", last4: undefined },
};
export const Banknote: Story = {
  args: { type: "CASH", name: "Efectivo", network: undefined, last4: undefined, currency: "COP" },
};
/** A draft with a type but no alias yet: the title prompts for one. */
export const Untitled: Story = { args: { name: "" } };
/** A save attempt found a problem on this one. */
export const Invalid: Story = { args: { last4: "88", invalid: true } };
/** A long alias ellipsizes instead of pushing the digits off the card. */
export const LongAlias: Story = {
  args: { name: "Bancolombia Débito Cuenta de Ahorros Principal" },
};
export const AllCompact: Story = { render: () => <Gallery size="compact" /> };
export const AllFull: Story = { render: () => <Gallery size="full" /> };
export const Tappable: Story = {
  render: (args) => <MethodFaceButton {...args} label="Edit Bancolombia" onClick={fn()} />,
};
