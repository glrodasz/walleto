import type { Decorator } from "@storybook/nextjs";

/** Constrain a story to a column; charts need a concrete width for ResponsiveContainer. */
export const boxed = (maxWidth: number): Decorator => {
  const Boxed: Decorator = (Story) => (
    <div style={{ maxWidth, width: "100%" }}>
      <Story />
    </div>
  );
  return Boxed;
};

/** A page-like column for cards that expect the main area's width. */
export const column: Decorator = boxed(760);
