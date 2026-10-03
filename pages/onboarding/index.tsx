import { withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import { IntroPage } from "../../features/onboarding/components/IntroPage";

// Client-side auth, like the wizard steps: a static page, no server round trip.
export default withPageAuthRequired(IntroPage);
