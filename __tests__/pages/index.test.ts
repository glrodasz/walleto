import type { GetServerSidePropsContext } from "next";

const getSessionMock = jest.fn();
const guardMock = jest.fn();

jest.mock("../../lib/auth0", () => ({
  __esModule: true,
  default: { getSession: (...args: unknown[]) => getSessionMock(...args) },
}));
jest.mock("../../features/onboarding/helpers/onboardingGuard", () => ({
  withOnboardingGuard: () => (ctx: unknown) => guardMock(ctx),
}));
jest.mock("../../features/dashboard/components/DashboardPage", () => ({
  DashboardPage: () => null,
}));
jest.mock("../../features/landing/components/LandingPage", () => ({
  LandingPage: () => null,
}));

import { getServerSideProps } from "../../pages/index";

const ctx = {
  req: { headers: { host: "walleto.app", "x-forwarded-proto": "https" } },
  res: {},
} as unknown as GetServerSidePropsContext;

describe("/", () => {
  beforeEach(() => {
    getSessionMock.mockReset();
    guardMock.mockReset();
  });

  it("shows the landing page to a signed-out visitor instead of the sign-in form", async () => {
    getSessionMock.mockResolvedValue(null);

    await expect(getServerSideProps(ctx)).resolves.toEqual({
      props: { landing: { origin: "https://walleto.app" } },
    });
    expect(guardMock).not.toHaveBeenCalled();
  });

  it("keeps a signed-in user on the dashboard's onboarding guard", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "auth0|1" } });
    guardMock.mockResolvedValue({ props: {} });

    await expect(getServerSideProps(ctx)).resolves.toEqual({ props: {} });
    expect(guardMock).toHaveBeenCalledWith(ctx);
  });
});
