import Document, { Html, Head, Main, NextScript } from "next/document";
import type { DocumentContext, DocumentInitialProps } from "next/document";
import { requestLanguage } from "../helpers/requestLanguage";
import type { Language } from "../types";
import { buildInfo } from "../helpers/buildInfo";

/**
 * Resolves the theme before first paint so a dark-mode user never sees a
 * light flash. Runs inline, ahead of every stylesheet; hooks/useTheme keeps
 * the attribute in sync afterwards. Next hydrates only #__next, so touching
 * <html> here never causes a hydration mismatch.
 */
const THEME_BOOT = `(function(){try{var p=localStorage.getItem("walleto:theme")||"system";var d=p==="dark"||(p==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.theme=d?"dark":"light"}catch(e){}})()`;

type Props = DocumentInitialProps & { language: Language };

export default function AppDocument({ language }: Props) {
  // data-env recolours the accent per build (styles/globals.css); the favicon
  // follows. The .ico and touch icon are blue rasters, so only production
  // links them — elsewhere a browser could prefer them over the tinted SVG.
  const { env, favicon } = buildInfo();
  return (
    <Html lang={language} data-theme="light" data-env={env}>
      <Head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
        <meta name="description" content="A clear plan today, a freer tomorrow." />
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

// Same resolution as pages/_app.tsx, so <html lang> matches the text.
AppDocument.getInitialProps = async (ctx: DocumentContext): Promise<Props> => {
  const initialProps = await Document.getInitialProps(ctx);
  return { ...initialProps, language: requestLanguage(ctx.req) };
};
