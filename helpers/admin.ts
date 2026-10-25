/**
 * Who may open /admin: the Auth0 user ids (`sub`) listed in ADMIN_USER_IDS,
 * comma-separated (the older single ADMIN_USER_ID still counts). Ids, never emails — an email can be changed or left
 * unverified at signup, a `sub` can't. Unset or empty means nobody.
 */
export function adminUserIds(
  raw: string | undefined = process.env.ADMIN_USER_IDS ?? process.env.ADMIN_USER_ID
): string[] {
  return (raw ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export function isAdmin(sub: string | null | undefined, raw?: string): boolean {
  if (!sub) return false;
  return adminUserIds(raw).includes(sub);
}
