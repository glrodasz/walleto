import "../styles/globals.css";
import ErrorBoundary from "../components/ErrorBoundary";
import { UserProvider } from "@auth0/nextjs-auth0/client";
import { Inter, JetBrains_Mono } from "next/font/google";
import type { AppProps } from "next/app";
import { DEFAULT_LOCALE, isLocale } from "../i18n/locale";
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

function MyApp({ Component, pageProps, router }: AppProps) {
  // The URL decides the language: Next strips the /es prefix into router.locale.
  const language = isLocale(router.locale) ? router.locale : DEFAULT_LOCALE;
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

export default MyApp;
