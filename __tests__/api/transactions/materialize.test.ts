import type { NextApiRequest, NextApiResponse } from "next";

const getSessionMock = jest.fn();
const collectionMock = jest.fn();
const getAllMock = jest.fn();
const batchSetMock = jest.fn();
const batchCommitMock = jest.fn().mockResolvedValue(undefined);

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
        getAll: getAllMock,
        batch: jest.fn(() => ({ set: batchSetMock, commit: batchCommitMock })),
      })),
      {
        FieldValue: { serverTimestamp: jest.fn(() => "SERVER_TIMESTAMP") },
        Timestamp: { fromDate: jest.fn((date: Date) => ({ __ts: date.toISOString() })) },
      }
    ),
  },
}));

import handler from "../../../pages/api/transactions/materialize";

const mockRes = () => {
  const res = {} as NextApiResponse;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
};

const ts = (iso: string) => {
  const date = new Date(iso);
  return { toDate: () => date };
};

/** Wires an items query result plus a transactions collection issuing id-carrying refs. */
const wireItems = (items: { id: string; data: Record<string, unknown> }[]) => {
  collectionMock.mockImplementation((name: string) => {
    if (name === "recurrentTransactions") {
      return {
        where: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({
          docs: items.map((i) => ({ id: i.id, data: () => i.data })),
        }),
      };
    }
    return { doc: jest.fn((id: string) => ({ id })) };
  });
};

const monthsAgo = (n: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
};

const monthlyItem = {
  id: "item1",
  data: {
    userId: "user1",
    domain: "EXPENSE",
    categoryId: "cat1",
    name: "Netflix",
    amount: 15,
    currency: "USD",
    frequency: "MONTHLY",
    startDate: ts(monthsAgo(8).toISOString()),
    active: true,
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  batchCommitMock.mockResolvedValue(undefined);
  getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
});

describe("POST /api/transactions/materialize", () => {
  it("returns 401 without a session", async () => {
    getSessionMock.mockResolvedValue(null);
    const res = mockRes();
    await handler({ method: "POST" } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 405 for non-POST", async () => {
    const res = mockRes();
    await handler({ method: "GET" } as NextApiRequest, res);
    expect(res.setHeader).toHaveBeenCalledWith("Allow", "POST");
    expect(res.status).toHaveBeenCalledWith(405);
  });

  it("creates PAID occurrences for the past six months with deterministic ids", async () => {
    wireItems([monthlyItem]);
    getAllMock.mockImplementation((...refs: { id: string }[]) =>
      Promise.resolve(refs.map((ref) => ({ ref, exists: false })))
    );

    const res = mockRes();
    await handler({ method: "POST" } as NextApiRequest, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const summary = (res.json as jest.Mock).mock.calls[0][0];
    // A monthly item older than the window yields 6 or 7 occurrences depending on the day.
    expect(summary.created).toBeGreaterThanOrEqual(6);
    expect(summary.existing).toBe(0);

    expect(batchSetMock).toHaveBeenCalledTimes(summary.created);
    const [ref, doc] = batchSetMock.mock.calls[0];
    expect(ref.id).toMatch(/^item1_\d{4}-\d{2}-\d{2}$/);
    expect(doc).toEqual(
      expect.objectContaining({
        userId: "user1",
        recurrentTransactionId: "item1",
        status: "PAID",
        createdAt: "SERVER_TIMESTAMP",
      })
    );
  });

  it("skips occurrences that already exist instead of overwriting them", async () => {
    wireItems([monthlyItem]);
    getAllMock.mockImplementation((...refs: { id: string }[]) =>
      Promise.resolve(refs.map((ref) => ({ ref, exists: true })))
    );

    const res = mockRes();
    await handler({ method: "POST" } as NextApiRequest, res);

    const summary = (res.json as jest.Mock).mock.calls[0][0];
    expect(summary.created).toBe(0);
    expect(summary.existing).toBeGreaterThanOrEqual(6);
    expect(batchSetMock).not.toHaveBeenCalled();
  });

  it("responds with zeros when the user has no active items", async () => {
    wireItems([]);
    const res = mockRes();
    await handler({ method: "POST" } as NextApiRequest, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ created: 0, existing: 0 });
    expect(getAllMock).not.toHaveBeenCalled();
  });
});
