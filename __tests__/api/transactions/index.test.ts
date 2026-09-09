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
      jest.fn(() => ({
        collection: collectionMock,
      })),
      {
        FieldValue: { serverTimestamp: jest.fn(() => "SERVER_TIMESTAMP") },
        Timestamp: { fromDate: jest.fn((date: Date) => ({ __ts: date.toISOString() })) },
      }
    ),
  },
}));

import handler from "../../../pages/api/transactions/index";

const mockRes = () => {
  const res = {} as NextApiResponse;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
};

const wireCollections = (opts: {
  category?: { exists: boolean; data?: Record<string, unknown> };
  paymentMethod?: { exists: boolean; data?: Record<string, unknown> };
  account?: { exists: boolean; data?: Record<string, unknown> };
  add?: jest.Mock;
}) => {
  const add = opts.add ?? jest.fn().mockResolvedValue({ id: "new-tx" });

  collectionMock.mockImplementation((name: string) => {
    if (name === "categories") {
      return {
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({
            exists: opts.category?.exists ?? true,
            data: () => opts.category?.data ?? { userId: "user1", domain: "EXPENSE" },
          }),
        }),
      };
    }
    if (name === "accounts") {
      return {
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({
            exists: opts.account?.exists ?? true,
            data: () => opts.account?.data ?? { userId: "user1", domain: "SAVING" },
          }),
        }),
      };
    }
    if (name === "paymentMethods") {
      return {
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({
            exists: opts.paymentMethod?.exists ?? true,
            data: () => opts.paymentMethod?.data ?? { userId: "user1" },
          }),
        }),
      };
    }
    return { add };
  });

  return add;
};

const validBody = {
  domain: "EXPENSE",
  categoryId: "cat1",
  name: "Coffee",
  amount: 4.5,
  currency: "USD",
  occurredAt: "2026-08-01T10:00:00.000Z",
};

beforeEach(() => {
  jest.clearAllMocks();
  getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
});

describe("POST /api/transactions", () => {
  it("returns 401 without a session", async () => {
    getSessionMock.mockResolvedValue(null);
    const res = mockRes();
    await handler({ method: "POST", body: validBody } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("creates a transaction with PAID as the default status", async () => {
    const add = wireCollections({});
    const res = mockRes();
    await handler({ method: "POST", body: validBody } as NextApiRequest, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(add).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user1",
        domain: "EXPENSE",
        name: "Coffee",
        status: "PAID",
        occurredAt: { __ts: "2026-08-01T10:00:00.000Z" },
      })
    );
  });

  it("rejects an invalid body", async () => {
    const res = mockRes();
    await handler({ method: "POST", body: { ...validBody, amount: -1 } } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("rejects a half charged pair", async () => {
    wireCollections({});
    const res = mockRes();
    await handler(
      { method: "POST", body: { ...validBody, chargedAmount: 20000 } } as NextApiRequest,
      res
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("rejects a chargedCurrency equal to currency", async () => {
    wireCollections({});
    const res = mockRes();
    await handler(
      {
        method: "POST",
        body: { ...validBody, chargedAmount: 5, chargedCurrency: "USD" },
      } as NextApiRequest,
      res
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("rejects someone else's category", async () => {
    wireCollections({
      category: { exists: true, data: { userId: "intruder", domain: "EXPENSE" } },
    });
    const res = mockRes();
    await handler({ method: "POST", body: validBody } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("rejects a category from another domain", async () => {
    wireCollections({ category: { exists: true, data: { userId: "user1", domain: "INCOME" } } });
    const res = mockRes();
    await handler({ method: "POST", body: validBody } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("rejects someone else's payment method", async () => {
    wireCollections({ paymentMethod: { exists: true, data: { userId: "intruder" } } });
    const res = mockRes();
    await handler(
      { method: "POST", body: { ...validBody, paymentMethodId: "pm1" } } as NextApiRequest,
      res
    );
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("returns 405 for other methods", async () => {
    const res = mockRes();
    await handler({ method: "GET" } as NextApiRequest, res);
    expect(res.setHeader).toHaveBeenCalledWith("Allow", "POST");
    expect(res.status).toHaveBeenCalledWith(405);
  });
});

describe("POST /api/transactions — accounts", () => {
  const savingBody = { ...validBody, domain: "SAVING", accountId: "acc1" };

  it("stores the accountId when the account is the caller's and in the domain", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
    const add = wireCollections({
      category: { exists: true, data: { userId: "user1", domain: "SAVING" } },
    });
    const res = mockRes();
    await handler({ method: "POST", query: {}, body: savingBody } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(add).toHaveBeenCalledWith(expect.objectContaining({ accountId: "acc1" }));
  });

  it("rejects an account from another domain", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
    wireCollections({
      category: { exists: true, data: { userId: "user1", domain: "SAVING" } },
      account: { exists: true, data: { userId: "user1", domain: "INVESTMENT" } },
    });
    const res = mockRes();
    await handler({ method: "POST", query: {}, body: savingBody } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Account domain mismatch" });
  });

  it("rejects someone else's account", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
    wireCollections({
      category: { exists: true, data: { userId: "user1", domain: "SAVING" } },
      account: { exists: true, data: { userId: "intruder", domain: "SAVING" } },
    });
    const res = mockRes();
    await handler({ method: "POST", query: {}, body: savingBody } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
