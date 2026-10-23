import type { GetServerSideProps } from "next";
import { sitemapXml } from "../features/landing/helpers/crawl";
import { requestOrigin } from "../utils/requestOrigin";

/** Built per request, like the landing's canonical URLs, from this deployment's origin. */
export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.end(sitemapXml(requestOrigin(req.headers) ?? ""));
  return { props: {} };
};

export default function Sitemap() {
  return null;
}
