import type { NextApiRequest, NextApiResponse } from "next";

const handleCallbackMock = jest.fn();
const handleLoginMock = jest.fn();
const handleLogoutMock = jest.fn();

jest.mock("../../lib/auth0", () => ({
  __esModule: true,
  default: {
    handleAuth: jest.fn(),
    handleCallback: (...args: unknown[]) => handleCallbackMock(...args),
    handleLogin: (...args: unknown[]) => handleLoginMock(...args),
    handleLogout: (...args: unknown[]) => handleLogoutMock(...args),
  },
}));

import {
  handleCallbackWithFallback,
  handleLoginForHost,
  handleLogoutForHost,
} from "../../pages/api/auth/[...auth0]";

const mockRes = () => {
  const res = {} as NextApiResponse;
  res.writeHead = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  return res;
};

describe("handleCallbackWithFallback", () => {
  beforeEach(() => {
    handleCallbackMock.mockReset();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  it("delegates to handleCallback on the happy path", async () => {
    handleCallbackMock.mockResolvedValue(undefined);
    const res = mockRes();

    await handleCallbackWithFallback({ headers: {} } as NextApiRequest, res);

    expect(handleCallbackMock).toHaveBeenCalledWith(expect.anything(), res, {});
    expect(res.writeHead).not.toHaveBeenCalled();
  });

  it("returns the user to the host they signed in from", async () => {
    handleCallbackMock.mockResolvedValue(undefined);
    const res = mockRes();
    const req = {
      headers: { host: "sublr-6gu7f1o6i-team.vercel.app", "x-forwarded-proto": "https" },
    } as unknown as NextApiRequest;

    await handleCallbackWithFallback(req, res);

    expect(handleCallbackMock).toHaveBeenCalledWith(req, res, {
      redirectUri: "https://sublr-6gu7f1o6i-team.vercel.app/api/auth/callback",
    });
  });

  it("redirects to /login-error with the encoded reason when the callback throws", async () => {
    const err = Object.assign(new Error("state mismatch"), { status: 400 });
    handleCallbackMock.mockRejectedValue(err);
    const res = mockRes();

    await handleCallbackWithFallback({ headers: {} } as unknown as NextApiRequest, res);

    expect(res.writeHead).toHaveBeenCalledWith(302, {
      Location: `/login-error?reason=${encodeURIComponent("state mismatch")}`,
    });
    expect(res.end).toHaveBeenCalled();
  });

  it("falls back to a status-derived reason when the error has no message", async () => {
    handleCallbackMock.mockRejectedValue(Object.assign(new Error(""), { status: 502 }));
    const res = mockRes();

    await handleCallbackWithFallback({ headers: {} } as unknown as NextApiRequest, res);

    expect(res.writeHead).toHaveBeenCalledWith(302, {
      Location: "/login-error?reason=auth_502",
    });
  });
});

describe("login and logout follow the request host", () => {
  const req = (host?: string) =>
    ({ headers: host ? { host, "x-forwarded-proto": "https" } : {} }) as unknown as NextApiRequest;

  it("asks Auth0 to send the user back to the host they started on", async () => {
    handleLoginMock.mockResolvedValue(undefined);
    const res = {} as NextApiResponse;
    await handleLoginForHost(req("sublr-git-branch-team.vercel.app"), res);
    expect(handleLoginMock).toHaveBeenCalledWith(expect.anything(), res, {
      authorizationParams: {
        redirect_uri: "https://sublr-git-branch-team.vercel.app/api/auth/callback",
      },
    });
  });

  it("keeps the configured base URL when the host is unknown", async () => {
    handleLoginMock.mockResolvedValue(undefined);
    await handleLoginForHost(req(), {} as NextApiResponse);
    expect(handleLoginMock).toHaveBeenCalledWith(expect.anything(), expect.anything(), {});
  });

  it("logs out back to the same origin", async () => {
    handleLogoutMock.mockResolvedValue(undefined);
    await handleLogoutForHost(req("sublr-git-branch-team.vercel.app"), {} as NextApiResponse);
    expect(handleLogoutMock).toHaveBeenCalledWith(expect.anything(), expect.anything(), {
      returnTo: "https://sublr-git-branch-team.vercel.app",
    });
  });
});
