import "../styles/globals.css";
import ErrorBoundary from "../components/ErrorBoundary";
import { UserProvider } from "@auth0/nextjs-auth0/client";
import { Inter, JetBrains_Mono } from "next/font/google";
import App from "next/app";
import type { AppContext, AppProps } from "next/app";
import { requestLanguage } from "../helpers/requestLanguage";
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

type Props = AppProps & { initialLanguage?: Language };

function MyApp({ Component, pageProps, initialLanguage }: Props) {
  return (
    <UserProvider>
      <UserDocProvider>
        <ThemeProvider>
          <MonthProvider>
            <PreferencesProvider initialLanguage={initialLanguage}>
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

// The language is decided before the first byte (the `locale` cookie, else
// Accept-Language) so a Spanish reader never sees English while Firestore
// loads. Every app page already renders per request (getServerSideProps), so
// this costs no static optimisation there.
MyApp.getInitialProps = async (context: AppContext) => {
  const props = await App.getInitialProps(context);
  return { ...props, initialLanguage: requestLanguage(context.ctx.req) };
};

export default MyApp;
