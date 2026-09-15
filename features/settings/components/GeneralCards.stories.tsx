import type { Meta, StoryObj } from "@storybook/nextjs";
import { mocked } from "storybook/test";
import { AccountCard } from "./AccountCard";
import { CurrencyCard } from "./CurrencyCard";
import { PreferencesCard } from "./PreferencesCard";
import { SetupCard } from "./SetupCard";
import { PrivacyCard } from "./PrivacyCard";
import { AboutCard } from "./AboutCard";
import { useUserDoc } from "../../../hooks/useUserDoc";
import { boxed } from "../../../stories/decorators";
import { hookDefaults } from "../../../stories/fixtures/hookDefaults";

/** The six cards of Settings › General. Each reads the mocked user doc on its own. */
function General() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: 16,
        alignItems: "start",
      }}
    >
      <div style={{ display: "grid", gap: 16 }}>
        <AccountCard />
        <CurrencyCard />
        <PreferencesCard />
      </div>
      <div style={{ display: "grid", gap: 16 }}>
        <SetupCard />
        <PrivacyCard />
        <AboutCard />
      </div>
    </div>
  );
}

const meta = {
  title: "Organisms/Settings/General cards",
  component: General,
  tags: ["autodocs"],
  decorators: [boxed(960)],
} satisfies Meta<typeof General>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllSix: Story = {};
export const Account: Story = { render: () => <AccountCard />, decorators: [boxed(480)] };
export const Currency: Story = { render: () => <CurrencyCard />, decorators: [boxed(480)] };
export const Preferences: Story = { render: () => <PreferencesCard />, decorators: [boxed(480)] };
export const Setup: Story = { render: () => <SetupCard />, decorators: [boxed(480)] };
export const Privacy: Story = { render: () => <PrivacyCard />, decorators: [boxed(480)] };
export const About: Story = { render: () => <AboutCard />, decorators: [boxed(480)] };
/** Before the user doc arrives. */
export const UserDocLoading: Story = {
  beforeEach: () => {
    mocked(useUserDoc).mockReturnValue({ ...hookDefaults.useUserDoc(), userDoc: null });
  },
};
