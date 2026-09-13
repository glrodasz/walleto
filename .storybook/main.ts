import type { StorybookConfig } from "@storybook/nextjs";

/**
 * Placeholders for the public env vars the UI reads at import time
 * (BuildBadge, AboutCard, firebase/client). Storybook never talks to
 * Firebase — every data hook is mocked in preview.tsx — but the client
 * module still expects a config object to exist.
 */
const STORY_ENV: Record<string, string> = {
  NEXT_PUBLIC_APP_ENV: "preview",
  NEXT_PUBLIC_APP_VERSION: "storybook",
  NEXT_PUBLIC_COMMIT_SHA: "0000000",
  NEXT_PUBLIC_API_KEY: "storybook",
  NEXT_PUBLIC_AUTH_DOMAIN: "storybook.firebaseapp.com",
  NEXT_PUBLIC_PROJECT_ID: "storybook",
  NEXT_PUBLIC_STORAGE_BUCKET: "storybook.appspot.com",
  NEXT_PUBLIC_MESSAGING_SENDER_ID: "000000000000",
  NEXT_PUBLIC_APP_ID: "1:000000000000:web:0000000000000000000000",
  NEXT_PUBLIC_SUPPORT_EMAIL: "support@waletto.example",
  NEXT_PUBLIC_FEEDBACK_URL: "https://github.com/glrodasz/walleto/issues",
};

const config: StorybookConfig = {
  framework: "@storybook/nextjs",
  stories: [
    "../stories/**/*.mdx",
    "../stories/**/*.stories.tsx",
    "../components/**/*.stories.tsx",
    "../features/**/*.stories.tsx",
  ],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
  // Background art (`/bg/*.svg`) and the favicon come from the app's public dir.
  staticDirs: ["../public"],
  env: (env) => ({ ...STORY_ENV, ...env }),
};

export default config;
