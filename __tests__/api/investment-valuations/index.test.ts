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
        Timestamp: { fromDate: jest.fn((date: Date) => ({ __ts: date.toISOString() })) },
      }
    ),
  },
}));

import handler from "../../../pages/api/investment-valuations/index";

const mockRes = () => {
  const res = {} as NextApiResponse;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
};

const wire = (
  category: { exists: boolean; data?: Record<string, unknown> },
  account: { exists: boolean; data?: Record<string, unknown> } = { exists: true }
) => {
  const add = jest.fn().mockResolvedValue({ id: "val1" });
  const docOf = (
    target: { exists: boolean; data?: Record<string, unknown> },
    fallback: object
  ) => ({
    doc: jest.fn().mockReturnValue({
      get: jest.fn().mockResolvedValue({
        exists: target.exists,
        data: () => target.data ?? fallback,
      }),
    }),
  });
  collectionMock.mockImplementation((name: string) =>
    name === "categories"
      ? docOf(category, { userId: "user1", domain: "INVESTMENT" })
      : name === "accounts"
        ? docOf(account, { userId: "user1", domain: "SAVING" })
        : { add }
  );
  return add;
};

const body = {
  categoryId: "funds",
  asOf: "2026-06-01T12:00:00.000Z",
  gainPct: 100,
  value: 260,
  costBasis: 130,
  currency: "USD",
};

beforeEach(() => {
  jest.clearAllMocks();
  getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
});

describe("POST /api/investment-valuations", () => {
  it("returns 401 without a session", async () => {
    getSessionMock.mockResolvedValue(null);
    const res = mockRes();
    await handler({ method: "POST", body } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("records a valuation for an owned investment category", async () => {
    const add = wire({ exists: true });
    const res = mockRes();
    await handler({ method: "POST", body: { ...body, note: "Q2" } } as NextApiRequest, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(add).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user1",
        categoryId: "funds",
        gainPct: 100,
        value: 260,
        costBasis: 130,
        currency: "USD",
        note: "Q2",
        asOf: { __ts: "2026-06-01T12:00:00.000Z" },
      })
    );
  });

  it("rejects a negative value", async () => {
    wire({ exists: true });
    const res = mockRes();
    await handler({ method: "POST", body: { ...body, value: -1 } } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("rejects someone else's category", async () => {
    wire({ exists: true, data: { userId: "intruder", domain: "INVESTMENT" } });
    const res = mockRes();
    await handler({ method: "POST", body } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("rejects a category outside investments and savings", async () => {
    wire({ exists: true, data: { userId: "user1", domain: "EXPENSE" } });
    const res = mockRes();
    await handler({ method: "POST", body } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("accepts a savings category", async () => {
    wire({ exists: true, data: { userId: "user1", domain: "SAVING" } });
    const res = mockRes();
    await handler({ method: "POST", body } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("records a valuation on an account instead of a category", async () => {
    const add = wire({ exists: false });
    const res = mockRes();
    const { categoryId: _omit, ...rest } = body;
    await handler({ method: "POST", body: { ...rest, accountId: "seb" } } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(add).toHaveBeenCalledWith(expect.objectContaining({ accountId: "seb" }));
    expect(add.mock.calls[0][0]).not.toHaveProperty("categoryId");
  });

  it("rejects someone else's account", async () => {
    wire({ exists: false }, { exists: true, data: { userId: "intruder", domain: "SAVING" } });
    const res = mockRes();
    const { categoryId: _omit, ...rest } = body;
    await handler({ method: "POST", body: { ...rest, accountId: "seb" } } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("rejects both or neither target", async () => {
    wire({ exists: true });
    const res = mockRes();
    await handler({ method: "POST", body: { ...body, accountId: "seb" } } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(400);
    const { categoryId: _omit, ...rest } = body;
    await handler({ method: "POST", body: rest } as NextApiRequest, res);
    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  it("returns 405 for other methods", async () => {
    const res = mockRes();
    await handler({ method: "GET" } as NextApiRequest, res);
    expect(res.setHeader).toHaveBeenCalledWith("Allow", "POST");
    expect(res.status).toHaveBeenCalledWith(405);
  });
});
