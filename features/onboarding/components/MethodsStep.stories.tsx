import type { Meta, StoryObj } from "@storybook/nextjs";
import { mocked, userEvent, within } from "storybook/test";
import { MethodsStep } from "./MethodsStep";
import { useMethodsStep } from "../hooks/useMethodsStep";
import { usePaymentMethods } from "../../../hooks/usePaymentMethods";
import { boxed } from "../../../stories/decorators";
import { hookDefaults } from "../../../stories/fixtures/hookDefaults";

/** The step needs its hook's state; the hook reads the mocked payment methods. */
function Demo({ hydrate }: { hydrate: boolean }) {
  const state = useMethodsStep({ hydrate });
  return <MethodsStep state={state} />;
}

const meta = {
  title: "Organisms/Onboarding/MethodsStep",
  component: Demo,
  tags: ["autodocs"],
  args: { hydrate: true },
  decorators: [boxed(860)],
} satisfies Meta<typeof Demo>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Saved methods hydrate as a closed wallet: each one drawn as what it is. */
export const WithSavedMethods: Story = {};
/** Tapping a face lifts it out with its fields; only the type is locked. */
export const EditingSaved: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", { name: /Bancolombia/ }));
  },
};
/** A brand-new user: one blank row. */
export const FreshStart: Story = {
  beforeEach: () => {
    mocked(usePaymentMethods).mockReturnValue({
      ...hookDefaults.usePaymentMethods(),
      methods: [],
    });
  },
};
export const Loading: Story = {
  beforeEach: () => {
    mocked(usePaymentMethods).mockReturnValue({
      ...hookDefaults.usePaymentMethods(),
      methods: [],
      loading: true,
    });
  },
};
