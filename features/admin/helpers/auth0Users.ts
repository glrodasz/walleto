import type { Auth0User } from "./usage";

/**
 * Reads every Auth0 account through the Management API, with a
 * machine-to-machine app granted `read:users`. Server only: the client
 * secret never leaves the API route.
 *
 * The Management API lives on the tenant's own domain (tenant.eu.auth0.com),
 * not on a custom login domain, so AUTH0_MGMT_DOMAIN can override the issuer.
 */
export function auth0MgmtConfig(env: Record<string, string | undefined> = process.env) {
  const clientId = env.AUTH0_MGMT_CLIENT_ID?.trim();
  const clientSecret = env.AUTH0_MGMT_CLIENT_SECRET?.trim();
  const domain = (env.AUTH0_MGMT_DOMAIN || env.AUTH0_ISSUER_BASE_URL || "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "");
  if (!clientId || !clientSecret || !domain) return null;
  return { clientId, clientSecret, domain };
}

type Config = NonNullable<ReturnType<typeof auth0MgmtConfig>>;

interface RawUser {
  user_id: string;
  email?: string;
  name?: string;
  created_at?: string;
  last_login?: string;
  logins_count?: number;
}

const PER_PAGE = 100;
// The API stops paging at 1,000 users; far beyond this app's size.
const MAX_PAGES = 10;
const FIELDS = "user_id,email,name,created_at,last_login,logins_count";

const toDate = (s: string | undefined) => (s ? new Date(s) : null);

async function managementToken({ clientId, clientSecret, domain }: Config): Promise<string> {
  const res = await fetch(`https://${domain}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      audience: `https://${domain}/api/v2/`,
    }),
  });
  if (!res.ok) throw new Error(`Auth0 token request failed (${res.status})`);
  const { access_token } = (await res.json()) as { access_token: string };
  return access_token;
}

export async function fetchAuth0Users(config: Config): Promise<Auth0User[]> {
  const token = await managementToken(config);
  const users: Auth0User[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const params = new URLSearchParams({
      page: String(page),
      per_page: String(PER_PAGE),
      fields: FIELDS,
      include_fields: "true",
    });
    const res = await fetch(`https://${config.domain}/api/v2/users?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Auth0 users request failed (${res.status})`);
    const batch = (await res.json()) as RawUser[];
    for (const u of batch) {
      users.push({
        id: u.user_id,
        email: u.email ?? null,
        name: u.name && u.name !== u.email ? u.name : null,
        createdAt: toDate(u.created_at),
        lastLoginAt: toDate(u.last_login),
        logins: u.logins_count ?? 0,
      });
    }
    if (batch.length < PER_PAGE) break;
  }
  return users;
}
