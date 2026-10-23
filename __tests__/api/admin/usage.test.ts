import type { NextApiRequest, NextApiResponse } from "next";

const getSessionMock = jest.fn();
const collectionMock = jest.fn();

jest.mock("../../../lib/auth0", () => ({
  __esModule: true,
  default: {
    withApiAuthRequired: (fn: unknown) => fn,
    getSession: (...args: unknown[]) => getSessionMock(...args),
  },
}));
jest.mock("../../../firebase/admin", () => ({
  __esModule: true,
  default: { firestore: jest.fn(() => ({ collection: collectionMock })) },
}));

import handler from "../../../pages/api/admin/usage";

const mockRes = () => {
  const res = {} as NextApiResponse;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
};

const ts = (iso: string) => ({ toDate: () => new Date(iso) });

beforeEach(() => {
  getSessionMock.mockReset();
  collectionMock.mockReset();
  process.env.ADMIN_USER_IDS = "auth0|owner";
  delete process.env.AUTH0_MGMT_CLIENT_ID;
  delete process.env.AUTH0_MGMT_CLIENT_SECRET;
});

describe("GET /api/admin/usage", () => {
  it("returns 401 when logged out", async () => {
    getSessionMock.mockResolvedValue(null);
    const res = mockRes();
    await handler({ method: "GET" } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(collectionMock).not.toHaveBeenCalled();
  });

  it("returns 404 to a logged-in user who isn't an admin", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "auth0|someone", email: "x@y.com" } });
    const res = mockRes();
    await handler({ method: "GET" } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(collectionMock).not.toHaveBeenCalled();
  });

  it("returns 404 to everyone when no admin is configured", async () => {
    process.env.ADMIN_USER_IDS = "";
    getSessionMock.mockResolvedValue({ user: { sub: "auth0|owner" } });
    const res = mockRes();
    await handler({ method: "GET" } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("answers the admin with counts and dates only", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "auth0|owner" } });
    collectionMock.mockImplementation((name: string) => {
      if (name === "users") {
        return {
          select: () => ({
            get: async () => ({
              docs: [
                {
                  id: "auth0|owner",
                  data: () => ({
                    createdAt: ts("2026-09-01T00:00:00Z"),
                    lastSeenAt: ts(new Date().toISOString()),
                    onboardingCompleted: true,
                  }),
                },
              ],
            }),
          }),
        };
      }
      const n = { recurrentTransactions: 4, transactions: 20, accounts: 2 }[name] ?? 0;
      return {
        where: () => ({ count: () => ({ get: async () => ({ data: () => ({ count: n }) }) }) }),
      };
    });
    const res = mockRes();
    await handler({ method: "GET" } as NextApiRequest, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.auth0).toBe("not-configured");
    expect(body.totals).toMatchObject({ users: 1, onboarded: 1, dau: 1 });
    expect(body.users[0]).toMatchObject({
      id: "auth0|owner",
      email: null,
      counts: { recurring: 4, transactions: 20, accounts: 2 },
    });
  });

  it("rejects other methods", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "auth0|owner" } });
    const res = mockRes();
    await handler({ method: "POST" } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(405);
  });
});
