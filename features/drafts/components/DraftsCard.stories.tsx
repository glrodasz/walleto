import type { Meta, StoryObj } from "@storybook/nextjs";
import { mocked } from "storybook/test";
import { DraftsCard } from "./DraftsCard";
import { useUserDoc } from "../../../hooks/useUserDoc";
import { hookDefaults } from "../../../stories/fixtures/hookDefaults";
import { STORY_USER_DOC } from "../../../stories/fixtures/user";
import { STORY_DRAFTS } from "../../../stories/fixtures/drafts";
import { MOBILE } from "../../../stories/templates";

/**
 * Expenses jotted down to finish later, on top of the Dashboard and the
 * Expenses page. Tapping one (or "Turn into expense") opens the full form
 * filled in; the card is gone when there are no drafts.
 */
const meta = {
  title: "Organisms/Drafts/DraftsCard",
  component: DraftsCard,
  tags: ["autodocs"],
  beforeEach: () => {
    mocked(useUserDoc).mockReturnValue({
      ...hookDefaults.useUserDoc(),
      userDoc: { ...STORY_USER_DOC, expenseDrafts: STORY_DRAFTS },
    });
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 760 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DraftsCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Mobile: Story = { globals: MOBILE };
/** No drafts: nothing renders. */
export const Empty: Story = {
  beforeEach: () => {
    mocked(useUserDoc).mockReturnValue(hookDefaults.useUserDoc());
  },
};
