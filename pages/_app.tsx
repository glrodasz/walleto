import "../styles/globals.css";
import ErrorBoundary from "../components/ErrorBoundary";
import { UserProvider } from "@auth0/nextjs-auth0/client";
import { Inter, JetBrains_Mono } from "next/font/google";
import App from "next/app";
import Head from "next/head";
import type { AppContext, AppProps } from "next/app";
import { requestLocale } from "../i18n/locale";
import type { Language } from "../types";
import { ThemeProvider } from "../hooks/useTheme";
import { MonthProvider } from "../hooks/useSelectedMonth";
import { PreferencesProvider } from "../hooks/PreferencesProvider";
import { PrivacyProvider } from "../hooks/usePrivacy";
import { UserDocProvider } from "../hooks/useUserDoc";
import { translate } from "../helpers/i18n";
import { PAGE_MESSAGES } from "../messages/pages";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

type Props = AppProps & { language: Language };

function MyApp({ Component, pageProps, language }: Props) {
  return (
    <UserProvider>
      <Head>
        {/* Next's default omits initial-scale; zooming stays allowed. */}
        <meta key="viewport" name="viewport" content="width=device-width, initial-scale=1" />
        {/* Keyed, so a page with its own description (the landing) replaces it. */}
        <meta
          key="description"
          name="description"
          content={translate(PAGE_MESSAGES, language, "meta.description")}
        />
      </Head>
      <UserDocProvider>
        <ThemeProvider>
          <PreferencesProvider language={language}>
            <MonthProvider>
              <PrivacyProvider>
                <div
                  className={`${inter.className} ${inter.variable} ${jetbrainsMono.variable}`}
                  style={{ minHeight: "100%" }}
                >
                  <ErrorBoundary>
                    <Component {...pageProps} />
                  </ErrorBoundary>
                </div>
              </PrivacyProvider>
            </MonthProvider>
          </PreferencesProvider>
        </ThemeProvider>
      </UserDocProvider>
    </UserProvider>
  );
}

// The language is decided before the first byte (the `locale` cookie, else
// Accept-Language), so a Spanish reader never sees an English first paint.
// On a client-side navigation it re-reads the cookie and navigator.languages.
MyApp.getInitialProps = async (context: AppContext) => {
  const props = await App.getInitialProps(context);
  return { ...props, language: requestLocale(context.ctx.req) };
};

export default MyApp;
