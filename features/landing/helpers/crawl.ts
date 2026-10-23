import type { Language } from "../../../types";
import type { BuildEnv } from "../../../helpers/buildInfo";
import { LANDING_PATH } from "../routes";

/**
 * robots.txt. Only production is indexed; the landing is its one public page,
 * so crawlers skip the API and the component workbench. Previews and local
 * builds ask every crawler to stay out.
 */
export function robotsTxt(origin: string, env: BuildEnv): string {
  if (env !== "production") return "User-agent: *\nDisallow: /\n";
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /api/",
    "Disallow: /storybook/",
    "",
    `Sitemap: ${origin}/sitemap.xml`,
    "",
  ].join("\n");
}

/** sitemap.xml: the landing in each language, each listing the others as hreflang alternates. */
export function sitemapXml(requestOrigin: string): string {
  // The origin comes from the request, so it is escaped before it goes into XML.
  const origin = requestOrigin.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);
  const languages = Object.keys(LANDING_PATH) as Language[];
  const alternates = [
    ...languages.map(
      (language) =>
        `    <xhtml:link rel="alternate" hreflang="${language}" href="${origin}${LANDING_PATH[language]}"/>`
    ),
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${origin}/"/>`,
  ].join("\n");
  const urls = languages
    .map(
      (language) =>
        `  <url>\n    <loc>${origin}${LANDING_PATH[language]}</loc>\n${alternates}\n  </url>`
    )
    .join("\n");
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    urls,
    "</urlset>",
    "",
  ].join("\n");
}
