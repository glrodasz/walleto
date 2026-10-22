import type { NextApiRequest, NextApiResponse } from "next";
import auth0 from "../../../lib/auth0";
import { requestOrigin } from "../../../utils/requestOrigin";
import { isLocale } from "../../../i18n/locale";

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

/**
 * The landing page's "Create account" links here with `?screen_hint=signup`
 * (Universal Login opens on its sign-up form) and `ui_locales` (in the
 * landing's language). Anything else in the query is ignored.
 */
export function loginParamsFor(req: NextApiRequest): Record<string, string> {
  const query = req.query ?? {};
  return {
    ...(query.screen_hint === "signup" && { screen_hint: "signup" }),
    ...(isLocale(query.ui_locales) && { ui_locales: query.ui_locales }),
  };
}

export async function handleLoginForHost(req: NextApiRequest, res: NextApiResponse) {
  const redirect_uri = callbackUrlFor(req);
  const authorizationParams = {
    ...loginParamsFor(req),
    ...(redirect_uri && { redirect_uri }),
  };
  await auth0.handleLogin(
    req,
    res,
    Object.keys(authorizationParams).length ? { authorizationParams } : {}
  );
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
