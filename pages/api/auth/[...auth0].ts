import type { NextApiRequest, NextApiResponse } from "next";
import auth0 from "../../../lib/auth0";
import { requestOrigin } from "../../../utils/requestOrigin";

/**
 * The redirect URI is derived per request from the host the user is on,
 * not from one base URL fixed at build time. Vercel serves the same build
 * under several hostnames (deployment hash, branch alias, custom domain);
 * the login state cookie lives on whichever the user opened, so Auth0 has
 * to send them back to that same host or the callback finds no cookie.
 * Auth0's allow-list still decides which hosts are acceptable.
 */
export function callbackUrlFor(req: NextApiRequest): string | undefined {
  const origin = requestOrigin(req.headers);
  return origin ? `${origin}/api/auth/callback` : undefined;
}

export async function handleLoginForHost(req: NextApiRequest, res: NextApiResponse) {
  const redirect_uri = callbackUrlFor(req);
  await auth0.handleLogin(req, res, redirect_uri ? { authorizationParams: { redirect_uri } } : {});
}

// Wrap the Auth0 callback so failures redirect to a readable error page.
// Default SDK behaviour ends with an empty/short error body and no
// Content-Type, which iOS Safari (with `X-Content-Type-Options: nosniff` set
// in next.config.js) presents as a 0 KB file download instead of an error.
export async function handleCallbackWithFallback(req: NextApiRequest, res: NextApiResponse) {
  try {
    const redirectUri = callbackUrlFor(req);
    await auth0.handleCallback(req, res, redirectUri ? { redirectUri } : {});
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = (error as { status?: number })?.status ?? 500;
    console.error("[auth0 callback] failed:", status, message);
    const reason = encodeURIComponent(message.slice(0, 200) || `auth_${status}`);
    res.writeHead(302, { Location: `/login-error?reason=${reason}` });
    res.end();
  }
}

export async function handleLogoutForHost(req: NextApiRequest, res: NextApiResponse) {
  const origin = requestOrigin(req.headers);
  await auth0.handleLogout(req, res, origin ? { returnTo: origin } : {});
}

export default auth0.handleAuth({
  login: handleLoginForHost,
  callback: handleCallbackWithFallback,
  logout: handleLogoutForHost,
});
