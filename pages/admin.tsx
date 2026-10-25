import auth0 from "../lib/auth0";
import { isAdmin } from "../helpers/admin";
import { AdminPage } from "../features/admin/components/AdminPage";

// Logged out → the login page; logged in but not in ADMIN_USER_IDS → a 404,
// so the page doesn't admit it exists. The data behind it checks again.
export const getServerSideProps = auth0.withPageAuthRequired({
  async getServerSideProps({ req, res }) {
    const session = await auth0.getSession(req, res);
    if (!isAdmin(session?.user?.sub)) return { notFound: true };
    return { props: {} };
  },
});

export default function Admin() {
  return <AdminPage />;
}
