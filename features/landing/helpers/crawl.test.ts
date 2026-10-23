import { robotsTxt, sitemapXml } from "./crawl";

describe("crawl files", () => {
  it("lets crawlers index production and points them at the sitemap", () => {
    const robots = robotsTxt("https://walleto.app", "production");
    expect(robots).toContain("Allow: /\n");
    expect(robots).toContain("Disallow: /api/");
    expect(robots).toContain("Sitemap: https://walleto.app/sitemap.xml");
  });

  it("keeps previews and local builds out of search results", () => {
    expect(robotsTxt("https://x.vercel.app", "preview")).toBe("User-agent: *\nDisallow: /\n");
    expect(robotsTxt("http://localhost:3000", "development")).toBe("User-agent: *\nDisallow: /\n");
  });

  it("lists /en and /es with hreflang alternates", () => {
    const xml = sitemapXml("https://walleto.app");
    expect(xml).toContain("<loc>https://walleto.app/en</loc>");
    expect(xml).toContain("<loc>https://walleto.app/es</loc>");
    expect(xml.match(/hreflang="x-default" href="https:\/\/walleto.app\/"/g)).toHaveLength(2);
  });

  it("escapes an origin that could break the XML", () => {
    expect(sitemapXml("https://a<b")).not.toContain("a<b");
  });
});
