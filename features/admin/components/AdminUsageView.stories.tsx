import type { Meta, StoryObj } from "@storybook/nextjs";
import { PageLayout } from "../../../components/organisms/PageLayout";
import { useT } from "../../../hooks/useT";
import { ADMIN_MESSAGES } from "../messages";
import { buildUsageSummary } from "../helpers/usage";
import type { Auth0User, StoredUser } from "../helpers/usage";
import type { ItemCounts } from "../types";
import { AdminUsageView } from "./AdminUsageView";
import { MOBILE, at, screen } from "../../../stories/templates";

const NOW = new Date("2026-10-23T15:30:00Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000);

const PEOPLE: [string, string, string | null, number, number | null, number, ItemCounts][] = [
  // id, email, name, signed up (days ago), last seen, logins, counts
  [
    "auth0|owner",
    "guillermo@example.com",
    "Guillermo",
    70,
    0.1,
    48,
    { recurring: 31, transactions: 412, accounts: 6 },
  ],
  [
    "google-oauth2|1",
    "ana.martinez@example.com",
    "Ana Martínez",
    12,
    0.6,
    9,
    { recurring: 14, transactions: 56, accounts: 3 },
  ],
  [
    "google-oauth2|2",
    "jsmith@example.com",
    "John Smith",
    5,
    3,
    4,
    { recurring: 8, transactions: 12, accounts: 1 },
  ],
  [
    "auth0|3",
    "laura@example.com",
    null,
    26,
    9,
    6,
    { recurring: 11, transactions: 40, accounts: 2 },
  ],
  [
    "auth0|4",
    "pedro.r@example.com",
    "Pedro Ruiz",
    2,
    null,
    1,
    { recurring: 0, transactions: 0, accounts: 0 },
  ],
  [
    "google-oauth2|5",
    "maria.g@example.com",
    "María G.",
    44,
    22,
    12,
    { recurring: 19, transactions: 133, accounts: 4 },
  ],
  ["auth0|6", "tom@example.com", null, 61, 50, 2, { recurring: 3, transactions: 7, accounts: 1 }],
];

const stored: StoredUser[] = PEOPLE.map(([id, , , signup, seen, , counts]) => ({
  id,
  createdAt: daysAgo(signup),
  lastSeenAt: seen === null ? null : daysAgo(seen),
  onboardingCompleted: counts.recurring > 0,
}));
const auth0Users: Auth0User[] = PEOPLE.map(([id, email, name, signup, seen, logins]) => ({
  id,
  email,
  name,
  createdAt: daysAgo(signup),
  lastLoginAt: daysAgo(seen === null ? signup : seen + 1),
  logins,
}));
const counts = new Map(PEOPLE.map(([id, , , , , , c]) => [id, c]));

const USAGE = buildUsageSummary({ stored, auth0Users, counts, auth0: "ok", now: NOW });
const NO_AUTH0 = buildUsageSummary({
  stored,
  auth0Users: [],
  counts,
  auth0: "not-configured",
  now: NOW,
});

type Args = Parameters<typeof AdminUsageView>[0];

function Screen(args: Args) {
  const t = useT(ADMIN_MESSAGES);
  return (
    <PageLayout title={t("page.title")} subtitle={t("page.subtitle")} hideCurrency hideMonth>
      <AdminUsageView {...args} />
    </PageLayout>
  );
}

/** The admin usage dashboard (/admin), only reachable by the ids in ADMIN_USER_IDS. */
const meta = {
  title: "Templates/Admin",
  component: Screen,
  parameters: { layout: "fullscreen", ...at("/admin") },
  decorators: [screen],
  args: { usage: USAGE, loading: false, error: null, onRefresh: () => {} },
} satisfies Meta<typeof Screen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Usage: Story = {};
export const Mobile: Story = { globals: MOBILE };
export const WithoutAuth0: Story = { args: { usage: NO_AUTH0 } };
export const Loading: Story = { args: { usage: null, loading: true } };
export const Failed: Story = {
  args: { usage: null, error: new Error("Request to /api/admin/usage failed with status 500") },
};
