/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const { version } = require("./package.json");

const nextConfig = {
  reactStrictMode: true,
  env: {
    // Shown in Settings › About; the same number as package.json.
    NEXT_PUBLIC_APP_VERSION: version,
    // Which build this is, read from Vercel's system env vars at build time.
    // Neither exists locally, so `next dev` resolves to the development badge.
    NEXT_PUBLIC_APP_ENV: process.env.VERCEL_ENV ?? "development",
    NEXT_PUBLIC_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA ?? "",
  },
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      // The component workbench isn't app content; keep it out of search results.
      // It also renders every story in a same-origin iframe, which the app's
      // blanket X-Frame-Options: DENY blocks — the sidebar loads and every
      // preview pane comes up empty. SAMEORIGIN here still refuses framing by
      // any other site, and the app itself keeps DENY.
      {
        source: "/storybook/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
  async redirects() {
    // Storybook's index.html points at its own assets relatively
    // (./sb-manager/runtime.js), so the browser has to actually be inside
    // /storybook/ for them to resolve. A rewrite serves that HTML while the
    // URL stays /storybook, where those paths resolve against the site root
    // and 404 — the page loads blank. Redirecting moves the browser, so the
    // base URL carries the folder and the assets resolve.
    return [{ source: "/storybook", destination: "/storybook/index.html", permanent: false }];
  },
};

module.exports = nextConfig;
