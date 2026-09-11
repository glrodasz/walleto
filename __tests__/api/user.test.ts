import type { NextApiRequest, NextApiResponse } from "next";

const getSessionMock = jest.fn();
const collectionMock = jest.fn();
const docMock = jest.fn();
const setMock = jest.fn();
const getMock = jest.fn();

jest.mock("../../lib/auth0", () => ({
  __esModule: true,
  default: {
    withApiAuthRequired: (fn: unknown) => fn,
    getSession: (...args: unknown[]) => getSessionMock(...args),
  },
}));
jest.mock("../../firebase/admin", () => ({
  __esModule: true,
  default: {
    firestore: Object.assign(
      jest.fn(() => ({
        collection: collectionMock,
      })),
      {
        FieldValue: { serverTimestamp: jest.fn(() => "SERVER_TIMESTAMP") },
      }
    ),
  },
}));

import handler from "../../pages/api/user";

const mockRes = () => {
  const res = {} as NextApiResponse;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  getSessionMock.mockReset();
  setMock.mockReset().mockResolvedValue(undefined);
  getMock.mockReset().mockResolvedValue({ exists: true, data: () => ({ mainCurrency: "USD" }) });
  docMock.mockReset().mockReturnValue({ set: setMock, get: getMock });
  collectionMock.mockReset().mockReturnValue({ doc: docMock });
});

describe("GET /api/user", () => {
  it("returns 401 when unauthenticated", async () => {
    getSessionMock.mockResolvedValue(null);
    const res = mockRes();
    await handler({ method: "GET", query: {} } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns the user doc", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
    const res = mockRes();
    await handler({ method: "GET", query: {} } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ id: "user1", mainCurrency: "USD" });
  });

  it("returns 404 when the doc does not exist yet", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
    getMock.mockResolvedValue({ exists: false, data: () => undefined });
    const res = mockRes();
    await handler({ method: "GET", query: {} } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe("PATCH /api/user", () => {
  it("returns 400 for an empty patch", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
    const res = mockRes();
    await handler({ method: "PATCH", query: {}, body: {} } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 400 for an unknown currency", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
    const res = mockRes();
    await handler(
      { method: "PATCH", query: {}, body: { mainCurrency: "XYZ" } } as NextApiRequest,
      res
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("merges the patch and returns 200", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
    const res = mockRes();
    await handler(
      {
        method: "PATCH",
        query: {},
        body: { onboardingCompleted: true, onboardingMode: "ASSISTED", mainCurrency: "EUR" },
      } as NextApiRequest,
      res
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(setMock).toHaveBeenCalledWith(
      { onboardingCompleted: true, onboardingMode: "ASSISTED", mainCurrency: "EUR" },
      { merge: true }
    );
  });
});

describe("unsupported methods", () => {
  it("returns 405", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
    const res = mockRes();
    await handler({ method: "DELETE", query: {} } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(405);
  });
});
