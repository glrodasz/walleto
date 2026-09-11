import { Html, Head, Main, NextScript } from "next/document";

/**
 * Resolves the theme before first paint so a dark-mode user never sees a
 * light flash. Runs inline, ahead of every stylesheet; hooks/useTheme keeps
 * the attribute in sync afterwards. Next hydrates only #__next, so touching
 * <html> here never causes a hydration mismatch.
 */
const THEME_BOOT = `(function(){try{var p=localStorage.getItem("waletto:theme")||"system";var d=p==="dark"||(p==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.theme=d?"dark":"light"}catch(e){}})()`;

export default function Document() {
  return (
    <Html lang="en" data-theme="light">
      <Head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
        <meta name="description" content="A clear plan today, a more free tomorrow." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
