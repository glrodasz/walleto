import auth0 from "../lib/auth0";
import { SettingsPage } from "../features/settings/components/SettingsPage";

export const getServerSideProps = auth0.withPageAuthRequired();

export default function Settings() {
  return <SettingsPage />;
}
