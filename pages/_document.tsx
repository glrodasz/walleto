import { Html, Head, Main, NextScript } from "next/document";
import type { DocumentProps } from "next/document";
import { DEFAULT_LOCALE, isLocale } from "../i18n/locale";
import { translate } from "../helpers/i18n";
import { PAGE_MESSAGES } from "../messages/pages";
import { buildInfo } from "../helpers/buildInfo";

/**
 * Resolves the theme before first paint so a dark-mode user never sees a
 * light flash. Runs inline, ahead of every stylesheet; hooks/useTheme keeps
 * the attribute in sync afterwards. Next hydrates only #__next, so touching
 * <html> here never causes a hydration mismatch.
 */
const THEME_BOOT = `(function(){try{var p=localStorage.getItem("walleto:theme")||"system";var d=p==="dark"||(p==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.theme=d?"dark":"light"}catch(e){}})()`;

export default function AppDocument({ locale }: DocumentProps) {
  // The URL's locale (Next's i18n routing), so <html lang> matches the text.
  const language = isLocale(locale) ? locale : DEFAULT_LOCALE;
  // data-env recolours the accent per build (styles/globals.css); the favicon
  // follows. The .ico and touch icon are blue rasters, so only production
  // links them — elsewhere a browser could prefer them over the tinted SVG.
  const { env, favicon } = buildInfo();
  return (
    <Html lang={language} data-theme="light" data-env={env}>
      <Head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
        <meta name="description" content={translate(PAGE_MESSAGES, language, "meta.description")} />
        <link rel="icon" href={favicon} type="image/svg+xml" />
        {env === "production" && (
          <>
            <link rel="icon" href="/favicon.ico" sizes="any" />
            <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
          </>
        )}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
