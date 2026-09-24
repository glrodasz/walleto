import type { GetServerSideProps } from "next";
import { ProspectPage } from "../features/prospect/components/ProspectPage";

// Prospect is hidden while it's reworked — the nav entry is disabled and this
// route redirects home in case someone still has the URL bookmarked.
export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: { destination: "/", permanent: false },
});

export default function Prospect() {
  return <ProspectPage />;
}
