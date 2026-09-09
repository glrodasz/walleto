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
  default: {
    firestore: Object.assign(
      jest.fn(() => ({ collection: collectionMock })),
      {
        FieldValue: { serverTimestamp: jest.fn(() => "SERVER_TIMESTAMP") },
      }
    ),
  },
}));

import handler from "../../../pages/api/accounts/index";

const mockRes = () => {
  const res = {} as NextApiResponse;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
};

const wire = (docs: { id: string; data: () => Record<string, unknown> }[] = []) => {
  const add = jest.fn().mockResolvedValue({ id: "acc-new" });
  const chain = {
    where: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue({ docs }),
    add,
  };
  collectionMock.mockReturnValue(chain);
  return { chain, add };
};

beforeEach(() => {
  jest.clearAllMocks();
  getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
});

describe("GET /api/accounts", () => {
  it("returns 401 when unauthenticated", async () => {
    getSessionMock.mockResolvedValue(null);
    const res = mockRes();
    await handler({ method: "GET", query: {} } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("lists the user's accounts, filtered by domain when asked", async () => {
    const { chain } = wire([{ id: "a1", data: () => ({ name: "ISK", domain: "INVESTMENT" }) }]);
    const res = mockRes();
    await handler(
      { method: "GET", query: { domain: "INVESTMENT" } } as unknown as NextApiRequest,
      res
    );
    expect(chain.where).toHaveBeenCalledWith("domain", "==", "INVESTMENT");
    expect(res.json).toHaveBeenCalledWith([{ id: "a1", name: "ISK", domain: "INVESTMENT" }]);
  });
});

describe("POST /api/accounts", () => {
  it("rejects a domain without accounts", async () => {
    wire();
    const res = mockRes();
    await handler(
      {
        method: "POST",
        query: {},
        body: { domain: "EXPENSE", name: "Wallet", currency: "USD" },
      } as NextApiRequest,
      res
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("rejects an interest rate above 100", async () => {
    wire();
    const res = mockRes();
    await handler(
      {
        method: "POST",
        query: {},
        body: {
          domain: "SAVING",
          name: "Fund",
          currency: "USD",
          interestRate: { value: 250, period: "YEARLY" },
        },
      } as NextApiRequest,
      res
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 409 when the domain already has that name, case-insensitively", async () => {
    wire([{ id: "a1", data: () => ({ name: "emergency fund" }) }]);
    const res = mockRes();
    await handler(
      {
        method: "POST",
        query: {},
        body: { domain: "SAVING", name: "Emergency Fund", currency: "USD" },
      } as NextApiRequest,
      res
    );
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: 'You already have a savings pocket called "Emergency Fund"',
    });
  });

  it("creates an account with its rate and returns 201", async () => {
    const { add } = wire();
    const res = mockRes();
    await handler(
      {
        method: "POST",
        query: {},
        body: {
          domain: "SAVING",
          name: "SEB savings",
          provider: "SEB",
          currency: "SEK",
          interestRate: { value: 2.5, period: "YEARLY" },
        },
      } as NextApiRequest,
      res
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: "acc-new" });
    expect(add).toHaveBeenCalledWith({
      userId: "user1",
      domain: "SAVING",
      name: "SEB savings",
      provider: "SEB",
      currency: "SEK",
      interestRate: { value: 2.5, period: "YEARLY" },
      archived: false,
      createdAt: "SERVER_TIMESTAMP",
    });
  });
});

describe("unsupported methods", () => {
  it("returns 405", async () => {
    wire();
    const res = mockRes();
    await handler({ method: "PUT", query: {} } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(405);
  });
});
