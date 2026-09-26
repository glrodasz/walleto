import "../styles/globals.css";
import ErrorBoundary from "../components/ErrorBoundary";
import { UserProvider } from "@auth0/nextjs-auth0/client";
import { Inter, JetBrains_Mono } from "next/font/google";
import type { AppProps } from "next/app";
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

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <UserProvider>
      <UserDocProvider>
        <ThemeProvider>
          <MonthProvider>
            <PreferencesProvider>
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
            </PreferencesProvider>
          </MonthProvider>
        </ThemeProvider>
      </UserDocProvider>
    </UserProvider>
  );
}

export default MyApp;
