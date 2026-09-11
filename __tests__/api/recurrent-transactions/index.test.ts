import type { NextApiRequest, NextApiResponse } from "next";

const getSessionMock = jest.fn();
const collectionMock = jest.fn();
const getAllMock = jest.fn();

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
        getAll: (...refs: unknown[]) => getAllMock(...refs),
      })),
      {
        FieldValue: { serverTimestamp: jest.fn(() => "SERVER_TIMESTAMP") },
        Timestamp: { fromDate: jest.fn((date: Date) => ({ __ts: date.toISOString() })) },
      }
    ),
  },
}));

import handler from "../../../pages/api/recurrent-transactions/index";

const mockRes = () => {
  const res = {} as NextApiResponse;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
};

/**
 * Routes the mocked `collection(name)` call per collection so a single POST can
 * see a category, a payment method, and the recurrentTransactions target.
 */
const wireCollections = (opts: {
  category?: { exists: boolean; data?: Record<string, unknown> };
  paymentMethod?: { exists: boolean; data?: Record<string, unknown> };
  account?: { exists: boolean; data?: Record<string, unknown> };
  add?: jest.Mock;
  listDocs?: { id: string; data: () => Record<string, unknown> }[];
}) => {
  const add = opts.add ?? jest.fn().mockResolvedValue({ id: "new-rt" });

  collectionMock.mockImplementation((name: string) => {
    if (name === "categories") {
      return {
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({
            exists: opts.category?.exists ?? true,
            data: () => opts.category?.data ?? { userId: "user1", domain: "INCOME" },
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
    if (name === "tags") {
      return { doc: jest.fn((id: string) => ({ id })) };
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
    return {
      where: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({ docs: opts.listDocs ?? [] }),
      add,
    };
  });

  return add;
};

const validBody = {
  domain: "INCOME",
  categoryId: "cat1",
  name: "Monthly salary",
  amount: 5000,
  currency: "USD",
  frequency: "MONTHLY",
};

beforeEach(() => {
  getSessionMock.mockReset();
  collectionMock.mockReset();
});

describe("GET /api/recurrent-transactions", () => {
  it("returns 401 when unauthenticated", async () => {
    getSessionMock.mockResolvedValue(null);
    const res = mockRes();
    await handler({ method: "GET", query: {} } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns the user's items", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
    wireCollections({
      listDocs: [{ id: "rt1", data: () => ({ name: "Rent", domain: "EXPENSE" }) }],
    });
    const res = mockRes();
    await handler({ method: "GET", query: {} } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([{ id: "rt1", name: "Rent", domain: "EXPENSE" }]);
  });
});

describe("POST /api/recurrent-transactions", () => {
  it("returns 400 for an invalid body", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
    wireCollections({});
    const res = mockRes();
    await handler({ method: "POST", query: {}, body: { domain: "NOPE" } } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 400 when the category does not exist", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
    wireCollections({ category: { exists: false } });
    const res = mockRes();
    await handler({ method: "POST", query: {}, body: validBody } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 403 when the category belongs to another user", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
    wireCollections({
      category: { exists: true, data: { userId: "someone-else", domain: "INCOME" } },
    });
    const res = mockRes();
    await handler({ method: "POST", query: {}, body: validBody } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("returns 400 when the category domain does not match", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
    wireCollections({
      category: { exists: true, data: { userId: "user1", domain: "EXPENSE" } },
    });
    const res = mockRes();
    await handler({ method: "POST", query: {}, body: validBody } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 403 when the payment method belongs to another user", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
    wireCollections({ paymentMethod: { exists: true, data: { userId: "someone-else" } } });
    const res = mockRes();
    await handler(
      {
        method: "POST",
        query: {},
        body: { ...validBody, paymentMethodId: "pm1" },
      } as NextApiRequest,
      res
    );
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("rejects a chargedCurrency equal to currency", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
    wireCollections({});
    const res = mockRes();
    await handler(
      {
        method: "POST",
        query: {},
        body: { ...validBody, chargedAmount: 100, chargedCurrency: "USD" },
      } as NextApiRequest,
      res
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("creates an item with a derived nextOccurrence and returns 201", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
    const add = wireCollections({});
    const res = mockRes();
    await handler({ method: "POST", query: {}, body: validBody } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: "new-rt" });
    expect(add).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user1",
        domain: "INCOME",
        active: true,
        nextOccurrence: expect.anything(),
      })
    );
  });
});

describe("unsupported methods", () => {
  it("returns 405", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
    wireCollections({});
    const res = mockRes();
    await handler({ method: "PUT", query: {} } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(405);
  });
});

describe("POST /api/recurrent-transactions — accounts", () => {
  const savingBody = { ...validBody, domain: "SAVING", accountId: "acc1" };

  it("stores the accountId on the item", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
    const add = wireCollections({
      category: { exists: true, data: { userId: "user1", domain: "SAVING" } },
    });
    const res = mockRes();
    await handler({ method: "POST", query: {}, body: savingBody } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(add).toHaveBeenCalledWith(expect.objectContaining({ accountId: "acc1" }));
  });

  it("rejects a missing account", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
    wireCollections({
      category: { exists: true, data: { userId: "user1", domain: "SAVING" } },
      account: { exists: false },
    });
    const res = mockRes();
    await handler({ method: "POST", query: {}, body: savingBody } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Account not found" });
  });
});

describe("POST /api/recurrent-transactions — tags and note", () => {
  it("stores deduped tags and the note after checking ownership", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
    const add = wireCollections({});
    getAllMock.mockResolvedValue([{ exists: true, data: () => ({ userId: "user1" }) }]);
    const res = mockRes();
    await handler(
      {
        method: "POST",
        query: {},
        body: { ...validBody, tags: ["t1", "t1"], note: "Shared" },
      } as NextApiRequest,
      res
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(add).toHaveBeenCalledWith(expect.objectContaining({ tags: ["t1"], note: "Shared" }));
  });

  it("rejects a foreign tag", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
    wireCollections({});
    getAllMock.mockResolvedValue([{ exists: true, data: () => ({ userId: "intruder" }) }]);
    const res = mockRes();
    await handler(
      { method: "POST", query: {}, body: { ...validBody, tags: ["t1"] } } as NextApiRequest,
      res
    );
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
