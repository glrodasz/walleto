import type { Meta, StoryObj } from "@storybook/nextjs";
import { mocked } from "storybook/test";
import { CategoriesSettings } from "./CategoriesSettings";
import { TagsSettings } from "./TagsSettings";
import { MethodsSettings } from "./MethodsSettings";
import { AccountsSettings } from "./AccountsSettings";
import { useCategories } from "../../../hooks/useCategories";
import { useTags } from "../../../hooks/useTags";
import { column } from "../../../stories/decorators";
import { hookDefaults } from "../../../stories/fixtures/hookDefaults";

/** The four CRUD sections of Settings; every one reads and writes through the mocked hooks. */
const meta = {
  title: "Organisms/Settings/Section panels",
  component: CategoriesSettings,
  tags: ["autodocs"],
  decorators: [column],
} satisfies Meta<typeof CategoriesSettings>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Categories: Story = {};
export const CategoriesLoading: Story = {
  beforeEach: () => {
    mocked(useCategories).mockImplementation((domain) => ({
      ...hookDefaults.useCategories(domain),
      categories: [],
      loading: true,
    }));
  },
};
export const Tags: Story = { render: () => <TagsSettings /> };
export const TagsEmpty: Story = {
  render: () => <TagsSettings />,
  beforeEach: () => {
    mocked(useTags).mockReturnValue({ ...hookDefaults.useTags(), tags: [] });
  },
};
export const PaymentMethods: Story = { render: () => <MethodsSettings /> };
export const AccountsAndPockets: Story = { render: () => <AccountsSettings /> };
