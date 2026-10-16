import "../styles/globals.css";
import ErrorBoundary from "../components/ErrorBoundary";
import { UserProvider } from "@auth0/nextjs-auth0/client";
import { Inter, JetBrains_Mono } from "next/font/google";
import App from "next/app";
import type { AppContext, AppProps } from "next/app";
import { requestLocale } from "../i18n/locale";
import type { Language } from "../types";
import { ThemeProvider } from "../hooks/useTheme";
import { MonthProvider } from "../hooks/useSelectedMonth";
import { PreferencesProvider } from "../hooks/PreferencesProvider";
import { PrivacyProvider } from "../hooks/usePrivacy";
import { UserDocProvider } from "../hooks/useUserDoc";

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
