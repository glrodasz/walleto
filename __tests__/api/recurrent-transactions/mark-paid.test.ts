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
        FieldValue: {
          serverTimestamp: jest.fn(() => "SERVER_TIMESTAMP"),
          delete: jest.fn(() => "DELETE_FIELD"),
        },
        Timestamp: { fromDate: jest.fn((date: Date) => ({ __ts: date.toISOString() })) },
      }
    ),
  },
}));

import handler from "../../../pages/api/recurrent-transactions/[id]/mark-paid";

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

const item = (overrides: Record<string, unknown> = {}) => ({
  userId: "user1",
  domain: "EXPENSE",
  categoryId: "cat1",
  name: "Netflix",
  amount: 15,
  currency: "USD",
  frequency: "MONTHLY",
  startDate: ts("2026-01-15T12:00:00.000Z"),
  nextOccurrence: ts("2026-03-15T12:00:00.000Z"),
  active: true,
  ...overrides,
});

const wireDoc = (data: Record<string, unknown> | undefined, opts: { exists?: boolean } = {}) => {
  const setMock = jest.fn().mockResolvedValue(undefined);
  const updateMock = jest.fn().mockResolvedValue(undefined);

  collectionMock.mockImplementation((name: string) => {
    if (name === "transactions") {
      return { doc: jest.fn(() => ({ set: setMock })) };
    }
    return {
      doc: jest.fn(() => ({
        get: jest.fn().mockResolvedValue({
          id: "rt1",
          exists: opts.exists ?? true,
          data: () => data,
        }),
        update: updateMock,
      })),
    };
  });

  return { setMock, updateMock };
};

const postReq = () => ({ method: "POST", query: { id: "rt1" } }) as unknown as NextApiRequest;

beforeEach(() => {
  jest.clearAllMocks();
  getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
});

describe("POST /api/recurrent-transactions/[id]/mark-paid", () => {
  it("returns 401 without a session", async () => {
    getSessionMock.mockResolvedValue(null);
    const res = mockRes();
    await handler(postReq(), res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 404 for a missing item", async () => {
    wireDoc(undefined, { exists: false });
    const res = mockRes();
    await handler(postReq(), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("returns 403 for someone else's item", async () => {
    wireDoc(item({ userId: "intruder" }));
    const res = mockRes();
    await handler(postReq(), res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("rejects an inactive item", async () => {
    wireDoc(item({ active: false }));
    const res = mockRes();
    await handler(postReq(), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("writes a PAID transaction at the deterministic occurrence id and advances the schedule", async () => {
    const { setMock, updateMock } = wireDoc(item());
    const res = mockRes();
    await handler(postReq(), res);

    expect(res.status).toHaveBeenCalledWith(200);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.transactionId).toBe("rt1_2026-03-15");

    expect(setMock).toHaveBeenCalledWith(
      expect.objectContaining({ status: "PAID", recurrentTransactionId: "rt1" }),
      { merge: true }
    );

    // Next monthly occurrence after 2026-03-15 is 2026-04-15.
    expect(updateMock).toHaveBeenCalledWith({
      nextOccurrence: { __ts: "2026-04-15T12:00:00.000Z" },
    });
  });

  it("falls back to now when the item has no nextOccurrence", async () => {
    wireDoc(item({ nextOccurrence: undefined }));
    const res = mockRes();
    await handler(postReq(), res);

    expect(res.status).toHaveBeenCalledWith(200);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.transactionId).toMatch(/^rt1_\d{4}-\d{2}-\d{2}$/);
  });

  it("returns 405 for non-POST", async () => {
    wireDoc(item());
    const res = mockRes();
    await handler({ method: "GET", query: { id: "rt1" } } as unknown as NextApiRequest, res);
    expect(res.setHeader).toHaveBeenCalledWith("Allow", "POST");
    expect(res.status).toHaveBeenCalledWith(405);
  });
});
