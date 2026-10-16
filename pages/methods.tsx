import type { GetServerSideProps } from "next";

/** Payment methods live in Settings now; old links and bookmarks land there. */
export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: { destination: "/settings#methods", permanent: false },
});

export default function MethodsRedirect() {
  return null;
}
