import "../styles/globals.css";
import ErrorBoundary from "../components/ErrorBoundary";
import { UserProvider } from "@auth0/nextjs-auth0/client";
import { Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import type { AppProps } from "next/app";
import { ThemeProvider } from "../hooks/useTheme";
import { MonthProvider } from "../hooks/useSelectedMonth";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Only the dashboard quote is set in serif; one weight is enough.
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
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
      <ThemeProvider>
        <MonthProvider>
          <div
            className={`${inter.className} ${inter.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}
            style={{ minHeight: "100%" }}
          >
            <ErrorBoundary>
              <Component {...pageProps} />
            </ErrorBoundary>
          </div>
        </MonthProvider>
      </ThemeProvider>
    </UserProvider>
  );
}

export default MyApp;
