import type { NextApiRequest, NextApiResponse } from "next";

const getSessionMock = jest.fn();
const collectionMock = jest.fn();
const getAllMock = jest.fn();
const batchUpdateMock = jest.fn();
const batchCommitMock = jest.fn().mockResolvedValue(undefined);
let linkedRows: { ref: string }[] = [];

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
        batch: jest.fn(() => ({ update: batchUpdateMock, commit: batchCommitMock })),
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

import handler from "../../../pages/api/recurrent-transactions/[id]";

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

const existingItem = {
  userId: "user1",
  domain: "EXPENSE",
  categoryId: "cat1",
  name: "Netflix",
  amount: 15,
  currency: "USD",
  frequency: "MONTHLY",
  startDate: ts("2026-01-15T12:00:00.000Z"),
  active: true,
};

const wireDoc = (opts: {
  exists?: boolean;
  data?: Record<string, unknown>;
  category?: { exists: boolean; data?: Record<string, unknown> };
  paymentMethod?: { exists: boolean; data?: Record<string, unknown> };
}) => {
  const update = jest.fn().mockResolvedValue(undefined);

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
    if (name === "tags") {
      return { doc: jest.fn((id: string) => ({ id })) };
    }
    if (name === "transactions") {
      return {
        where: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({ docs: linkedRows }),
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
    return {
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({
          exists: opts.exists ?? true,
          data: () => opts.data ?? existingItem,
        }),
        update,
      }),
    };
  });

  return update;
};

const patchReq = (body: Record<string, unknown>) =>
  ({ method: "PATCH", query: { id: "rt1" }, body }) as unknown as NextApiRequest;

beforeEach(() => {
  jest.clearAllMocks();
  getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
});

describe("PATCH /api/recurrent-transactions/[id]", () => {
  it("returns 403 for someone else's item", async () => {
    wireDoc({ data: { ...existingItem, userId: "intruder" } });
    const res = mockRes();
    await handler(patchReq({ name: "Hulu" }), res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("updates simple fields", async () => {
    const update = wireDoc({});
    const res = mockRes();
    await handler(patchReq({ name: "Hulu", amount: 12 }), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(update).toHaveBeenCalledWith({ name: "Hulu", amount: 12 });
  });

  it("rejects an empty patch", async () => {
    wireDoc({});
    const res = mockRes();
    await handler(patchReq({}), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("rejects a new currency that collides with the stored charged pair", async () => {
    wireDoc({ data: { ...existingItem, chargedAmount: 60000, chargedCurrency: "COP" } });
    const res = mockRes();
    await handler(patchReq({ currency: "COP" }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("rejects a category from another domain", async () => {
    wireDoc({ category: { exists: true, data: { userId: "user1", domain: "INCOME" } } });
    const res = mockRes();
    await handler(patchReq({ categoryId: "cat2" }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("rejects someone else's payment method", async () => {
    wireDoc({ paymentMethod: { exists: true, data: { userId: "intruder" } } });
    const res = mockRes();
    await handler(patchReq({ paymentMethodId: "pm1" }), res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("recomputes nextOccurrence when the frequency changes", async () => {
    const update = wireDoc({});
    const res = mockRes();
    await handler(patchReq({ frequency: "YEARLY" }), res);

    expect(res.status).toHaveBeenCalledWith(200);
    const patch = update.mock.calls[0][0];
    expect(patch.frequency).toBe("YEARLY");
    expect(patch.nextOccurrence.__ts).toMatch(/^\d{4}-01-15/);
  });

  it("clears nextOccurrence when the schedule becomes ONE_TIME", async () => {
    const update = wireDoc({});
    const res = mockRes();
    await handler(patchReq({ frequency: "ONE_TIME" }), res);

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ frequency: "ONE_TIME", nextOccurrence: "DELETE_FIELD" })
    );
  });

  it("clears the charged pair and payment method with nulls", async () => {
    const update = wireDoc({
      data: {
        ...existingItem,
        chargedAmount: 60000,
        chargedCurrency: "COP",
        paymentMethodId: "pm1",
      },
    });
    const res = mockRes();
    await handler(
      patchReq({ chargedAmount: null, chargedCurrency: null, paymentMethodId: null }),
      res
    );

    expect(update).toHaveBeenCalledWith({
      chargedAmount: "DELETE_FIELD",
      chargedCurrency: "DELETE_FIELD",
      paymentMethodId: "DELETE_FIELD",
    });
  });
});

describe("DELETE /api/recurrent-transactions/[id]", () => {
  it("still deactivates the item", async () => {
    const update = wireDoc({});
    const res = mockRes();
    await handler({ method: "DELETE", query: { id: "rt1" } } as unknown as NextApiRequest, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(update).toHaveBeenCalledWith({ active: false });
  });

  it("returns 405 for other methods", async () => {
    wireDoc({});
    const res = mockRes();
    await handler({ method: "GET", query: { id: "rt1" } } as unknown as NextApiRequest, res);
    expect(res.setHeader).toHaveBeenCalledWith("Allow", "PATCH, DELETE");
    expect(res.status).toHaveBeenCalledWith(405);
  });
});

describe("PATCH /api/recurrent-transactions/[id] — inheritance and backfill", () => {
  const req = (body: unknown) =>
    ({ method: "PATCH", query: { id: "rt1" }, body }) as unknown as NextApiRequest;

  beforeEach(() => {
    batchUpdateMock.mockClear();
    batchCommitMock.mockClear();
    linkedRows = [];
  });

  it("stores the inherit flags without touching the payments", async () => {
    const update = wireDoc({});
    const res = mockRes();
    await handler(req({ inheritTags: true, inheritNote: false }), res);
    expect(update).toHaveBeenCalledWith({ inheritTags: true, inheritNote: false });
    expect(batchUpdateMock).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ id: "rt1", updated: 0 });
  });

  it("rewrites tags and note on every linked payment when asked, and never stores the flag", async () => {
    linkedRows = [{ ref: "row1" }, { ref: "row2" }];
    const update = wireDoc({});
    getAllMock.mockResolvedValue([{ exists: true, data: () => ({ userId: "user1" }) }]);
    const res = mockRes();
    await handler(req({ tags: ["t1"], note: "", inheritTags: true, applyToExisting: true }), res);
    expect(update).toHaveBeenCalledWith({ tags: ["t1"], note: "DELETE_FIELD", inheritTags: true });
    expect(update.mock.calls[0][0]).not.toHaveProperty("applyToExisting");
    expect(batchUpdateMock).toHaveBeenCalledTimes(2);
    expect(batchUpdateMock).toHaveBeenCalledWith("row1", { tags: ["t1"], note: "DELETE_FIELD" });
    expect(batchCommitMock).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({ id: "rt1", updated: 2 });
  });

  it("ignores applyToExisting when neither tags nor note changed", async () => {
    linkedRows = [{ ref: "row1" }];
    wireDoc({});
    const res = mockRes();
    await handler(req({ name: "Renamed", applyToExisting: true }), res);
    expect(batchUpdateMock).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ id: "rt1", updated: 0 });
  });
});
