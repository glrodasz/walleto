import type { Meta, StoryObj } from "@storybook/nextjs";
import { ErrorState } from "./ErrorState";

const meta = {
  title: "Atoms/ErrorState",
  component: ErrorState,
  tags: ["autodocs"],
} satisfies Meta<typeof ErrorState>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Distinct from EmptyState on purpose: a failure must never read as "no data". */
export const Default: Story = {
  args: { error: new Error("Missing or insufficient permissions.") },
};

export const CustomCopy: Story = {
  args: {
    title: "Exchange rates unavailable",
    description:
      "Totals mix currencies without conversion right now. They'll correct themselves when rates load again.",
  },
};

/** Firestore's index error carries the console link that creates the index. */
export const FirestoreIndex: Story = {
  args: {
    error: new Error(
      "The query requires an index. You can create it here: https://console.firebase.google.com/v1/r/project/waletto/firestore/indexes?create_composite=Ck9wcm9qZWN0cy93YWxldHRvL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy90cmFuc2FjdGlvbnMvaW5kZXhlcy9fEAEaCgoGdXNlcklkEAEaCgoGZG9tYWluEAEaDgoKb2NjdXJyZWRBdBACGgwKCF9fbmFtZV9fEAI"
    ),
  },
};
