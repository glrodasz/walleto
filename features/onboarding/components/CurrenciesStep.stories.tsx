import type { Meta, StoryObj } from "@storybook/nextjs";
import { mocked } from "storybook/test";
import { CurrenciesStep } from "./CurrenciesStep";
import { useCurrenciesStep } from "../hooks/useCurrenciesStep";
import { useUserDoc } from "../../../hooks/useUserDoc";
import { boxed } from "../../../stories/decorators";
import { hookDefaults } from "../../../stories/fixtures/hookDefaults";
import { STORY_USER_DOC } from "../../../stories/fixtures/user";

function Demo() {
  const state = useCurrenciesStep();
  return <CurrenciesStep state={state} />;
}

const meta = {
  title: "Organisms/Onboarding/CurrenciesStep",
  component: Demo,
  tags: ["autodocs"],
  decorators: [boxed(860)],
} satisfies Meta<typeof Demo>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The demo profile: its currency and the ones it already offers. */
export const Default: Story = {};
/** A new user: USD until they pick, and the USD / EUR / GBP defaults. */
export const FirstRun: Story = {
  beforeEach: () => {
    mocked(useUserDoc).mockReturnValue({
      ...hookDefaults.useUserDoc(),
      userDoc: { mainCurrency: "USD", onboardingCompleted: false },
    });
  },
};
export const Colombia: Story = {
  beforeEach: () => {
    mocked(useUserDoc).mockReturnValue({
      ...hookDefaults.useUserDoc(),
      userDoc: {
        ...STORY_USER_DOC,
        mainCurrency: "COP",
        displayCurrency: "COP",
        enabledCurrencies: ["USD", "EUR", "COP"],
      },
    });
  },
};
