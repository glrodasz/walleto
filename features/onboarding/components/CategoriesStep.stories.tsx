import type { Meta, StoryObj } from "@storybook/nextjs";
import { mocked } from "storybook/test";
import { CategoriesStep } from "./CategoriesStep";
import { useCategories } from "../../../hooks/useCategories";
import { boxed } from "../../../stories/decorators";
import { hookDefaults } from "../../../stories/fixtures/hookDefaults";

/** One chip section per domain; creating persists at once through the mocked hook. */
const meta = {
  title: "Organisms/Onboarding/CategoriesStep",
  component: CategoriesStep,
  tags: ["autodocs"],
  decorators: [boxed(860)],
} satisfies Meta<typeof CategoriesStep>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithDefaults: Story = {};
export const Empty: Story = {
  beforeEach: () => {
    mocked(useCategories).mockImplementation((domain) => ({
      ...hookDefaults.useCategories(domain),
      categories: [],
    }));
  },
};
