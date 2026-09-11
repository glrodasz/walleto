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
        FieldValue: { delete: jest.fn(() => "DELETE_FIELD") },
        Timestamp: { fromDate: jest.fn((date: Date) => ({ __ts: date.toISOString() })) },
      }
    ),
  },
}));

import handler from "../../../pages/api/investment-valuations/[id]";

const mockRes = () => {
  const res = {} as NextApiResponse;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
};

const wireDoc = (data: Record<string, unknown> | undefined, exists = true) => {
  const update = jest.fn().mockResolvedValue(undefined);
  const del = jest.fn().mockResolvedValue(undefined);
  collectionMock.mockReturnValue({
    doc: jest.fn(() => ({
      get: jest.fn().mockResolvedValue({ exists, data: () => data }),
      update,
      delete: del,
    })),
  });
  return { update, del };
};

const req = (method: string, body?: unknown) =>
  ({ method, query: { id: "val1" }, body }) as unknown as NextApiRequest;

beforeEach(() => {
  jest.clearAllMocks();
  getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
});

describe("PATCH /api/investment-valuations/[id]", () => {
  it("returns 404 for a missing valuation", async () => {
    wireDoc(undefined, false);
    const res = mockRes();
    await handler(req("PATCH", { value: 1 }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("returns 403 for someone else's valuation", async () => {
    wireDoc({ userId: "intruder" });
    const res = mockRes();
    await handler(req("PATCH", { value: 1 }), res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("updates the fields sent and clears the note with null", async () => {
    const { update } = wireDoc({ userId: "user1" });
    const res = mockRes();
    await handler(req("PATCH", { value: 230, gainPct: 76.9, note: null }), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(update).toHaveBeenCalledWith({ value: 230, gainPct: 76.9, note: "DELETE_FIELD" });
  });

  it("rejects an empty patch", async () => {
    wireDoc({ userId: "user1" });
    const res = mockRes();
    await handler(req("PATCH", {}), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe("DELETE /api/investment-valuations/[id]", () => {
  it("really deletes — nothing references a valuation", async () => {
    const { del } = wireDoc({ userId: "user1" });
    const res = mockRes();
    await handler(req("DELETE"), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(del).toHaveBeenCalled();
  });

  it("returns 405 for other methods", async () => {
    wireDoc({ userId: "user1" });
    const res = mockRes();
    await handler(req("GET"), res);
    expect(res.setHeader).toHaveBeenCalledWith("Allow", "PATCH, DELETE");
    expect(res.status).toHaveBeenCalledWith(405);
  });
});
