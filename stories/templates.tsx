import type { Decorator } from "@storybook/nextjs";

/** Templates render whole screens: no padding, full viewport height. */
export const screen: Decorator = (Story) => (
  <div style={{ minHeight: "100vh" }}>
    <Story />
  </div>
);

/** Router state for a page, so the sidebar highlights it. */
export const at = (pathname: string, query: Record<string, string> = {}) => ({
  nextjs: { router: { pathname, asPath: pathname, query } },
});

/** Settings and domain pages keep their active section in the URL hash. */
export const withHash = (hash: string) => () => {
  const base = window.location.pathname + window.location.search;
  window.history.replaceState(null, "", hash ? `${base}#${hash}` : base);
};

export const MOBILE = { viewport: { value: "mobile1", isRotated: false } };
