/**
 * Auth0 Management API, used only to erase an identity when a person deletes
 * their account. Needs a Machine-to-Machine application with `delete:users`
 * on the tenant's Management API (AUTH0_MGMT_CLIENT_ID / _SECRET). Without
 * those the app still erases everything it holds; the identity is then
 * removed by hand from the Auth0 dashboard (docs/compliance.md).
 */
export function isAuth0ManagementConfigured(): boolean {
  return Boolean(
    process.env.AUTH0_ISSUER_BASE_URL &&
    process.env.AUTH0_MGMT_CLIENT_ID &&
    process.env.AUTH0_MGMT_CLIENT_SECRET
  );
}

async function managementToken(): Promise<string> {
  const issuer = process.env.AUTH0_ISSUER_BASE_URL!.replace(/\/$/, "");
  const res = await fetch(`${issuer}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: process.env.AUTH0_MGMT_CLIENT_ID,
      client_secret: process.env.AUTH0_MGMT_CLIENT_SECRET,
      audience: `${issuer}/api/v2/`,
    }),
  });
  if (!res.ok) throw new Error(`Auth0 token request failed with status ${res.status}`);
  const { access_token: token } = (await res.json()) as { access_token?: string };
  if (!token) throw new Error("Auth0 token response carried no access_token");
  return token;
}

/** Deletes the Auth0 user behind `sub`. A user already gone counts as done. */
export async function deleteAuth0User(sub: string): Promise<void> {
  const issuer = process.env.AUTH0_ISSUER_BASE_URL!.replace(/\/$/, "");
  const token = await managementToken();
  const res = await fetch(`${issuer}/api/v2/users/${encodeURIComponent(sub)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok && res.status !== 404) {
    throw new Error(`Auth0 user deletion failed with status ${res.status}`);
  }
}
