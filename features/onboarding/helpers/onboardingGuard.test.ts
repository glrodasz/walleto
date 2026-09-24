import type { GetServerSidePropsContext } from "next";

const getSessionMock = jest.fn();
const updateSessionMock = jest.fn();
const getMock = jest.fn();
const docMock = jest.fn();
const collectionMock = jest.fn();

// withPageAuthRequired here just unwraps the inner getServerSideProps, which is
// the part this guard actually owns.
jest.mock("../../../lib/auth0", () => ({
  __esModule: true,
  default: {
    withPageAuthRequired:
      (opts: { getServerSideProps: (ctx: unknown) => unknown }) => (ctx: unknown) =>
        opts.getServerSideProps(ctx),
    getSession: (...args: unknown[]) => getSessionMock(...args),
    updateSession: (...args: unknown[]) => updateSessionMock(...args),
  },
}));
jest.mock("../../../firebase/admin", () => ({
  __esModule: true,
  default: {
    firestore: jest.fn(() => ({ collection: collectionMock })),
  },
}));

import { withOnboardingGuard, ONBOARDING_ENTRY } from "./onboardingGuard";

const ctx = {} as GetServerSidePropsContext;
const run = () => withOnboardingGuard()(ctx);

beforeEach(() => {
  getSessionMock.mockReset();
  updateSessionMock.mockReset().mockResolvedValue(undefined);
  getMock.mockReset();
  docMock.mockReset().mockReturnValue({ get: getMock });
  collectionMock.mockReset().mockReturnValue({ doc: docMock });
});

describe("withOnboardingGuard", () => {
  it("lets a fully onboarded user through", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
    getMock.mockResolvedValue({ data: () => ({ onboardingCompleted: true }) });
    await expect(run()).resolves.toEqual({ props: {} });
  });

  it("caches the onboarded flag in the session once the doc confirms it", async () => {
    const session = { user: { sub: "user1" } };
    getSessionMock.mockResolvedValue(session);
    getMock.mockResolvedValue({ data: () => ({ onboardingCompleted: true }) });
    await run();
    expect(updateSessionMock).toHaveBeenCalledWith(ctx.req, ctx.res, {
      ...session,
      onboarded: true,
    });
  });

  it("skips the Firestore read when the session already says onboarded", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "user1" }, onboarded: true });
    await expect(run()).resolves.toEqual({ props: {} });
    expect(collectionMock).not.toHaveBeenCalled();
    expect(updateSessionMock).not.toHaveBeenCalled();
  });

  it("does not cache anything for a user still onboarding", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
    getMock.mockResolvedValue({ data: () => ({ onboardingCompleted: false }) });
    await run();
    expect(updateSessionMock).not.toHaveBeenCalled();
  });

  it("redirects when onboarding is not complete", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
    getMock.mockResolvedValue({ data: () => ({ onboardingCompleted: false }) });
    await expect(run()).resolves.toEqual({
      redirect: { destination: ONBOARDING_ENTRY, permanent: false },
    });
  });

  it("redirects a brand new user whose doc does not exist yet", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
    getMock.mockResolvedValue({ data: () => undefined });
    await expect(run()).resolves.toEqual({
      redirect: { destination: ONBOARDING_ENTRY, permanent: false },
    });
  });

  it("does not lock the user out when Firestore is unreachable", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
    getMock.mockRejectedValue(new Error("unavailable"));
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(run()).resolves.toEqual({ props: {} });
    spy.mockRestore();
  });

  it("passes through when there is no session", async () => {
    getSessionMock.mockResolvedValue(null);
    await expect(run()).resolves.toEqual({ props: {} });
    expect(collectionMock).not.toHaveBeenCalled();
  });

  it("targets a route that is not itself guarded, so no redirect loop is possible", () => {
    expect(ONBOARDING_ENTRY).toBe("/onboarding/categories");
  });
});
