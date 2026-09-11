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
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

module.exports = nextConfig;
