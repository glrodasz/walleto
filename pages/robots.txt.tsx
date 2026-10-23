import type { GetServerSideProps } from "next";
import { buildInfo } from "../helpers/buildInfo";
import { robotsTxt } from "../features/landing/helpers/crawl";
import { requestOrigin } from "../utils/requestOrigin";

/** Built per request, because the Sitemap line needs this deployment's origin. */
export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.end(robotsTxt(requestOrigin(req.headers) ?? "", buildInfo().env));
  return { props: {} };
};

export default function Robots() {
  return null;
}
