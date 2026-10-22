import type { GetServerSideProps } from "next";
import auth0 from "../../../lib/auth0";
import { requestOrigin } from "../../../utils/requestOrigin";

export interface LandingRouteProps {
  origin: string;
  signedIn: boolean;
}

/**
 * Props for /en and /es: the request's origin (for absolute SEO URLs) and
 * whether a session exists, so a signed-in visitor gets "Open Walleto"
 * rather than "Create account".
 */
export const getLandingProps: GetServerSideProps<LandingRouteProps> = async (ctx) => {
  const session = await auth0.getSession(ctx.req, ctx.res);
  return {
    props: { origin: requestOrigin(ctx.req.headers) ?? "", signedIn: Boolean(session) },
  };
};
