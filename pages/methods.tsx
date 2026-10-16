import type { GetServerSideProps } from "next";
import { DEFAULT_LOCALE, isLocale, localizePath } from "../i18n/locale";

/** Payment methods live in Settings now; old links and bookmarks land there. */
export const getServerSideProps: GetServerSideProps = async ({ locale }) => ({
  redirect: {
    destination: localizePath("/settings", isLocale(locale) ? locale : DEFAULT_LOCALE) + "#methods",
    permanent: false,
  },
});

export default function MethodsRedirect() {
  return null;
}
