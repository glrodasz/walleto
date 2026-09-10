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
        FieldValue: {
          serverTimestamp: jest.fn(() => "SERVER_TIMESTAMP"),
          delete: jest.fn(() => "DELETE_FIELD"),
        },
        Timestamp: { fromDate: jest.fn((date: Date) => ({ __ts: date.toISOString() })) },
      }
    ),
  },
}));

import handler from "../../../pages/api/transactions/[id]";

const mockRes = () => {
  const res = {} as NextApiResponse;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
};

const wireDoc = (opts: {
  exists?: boolean;
  data?: Record<string, unknown>;
  paymentMethod?: { exists: boolean; data?: Record<string, unknown> };
}) => {
  const update = jest.fn().mockResolvedValue(undefined);

  collectionMock.mockImplementation((name: string) => {
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
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({
          exists: opts.exists ?? true,
          data: () => opts.data ?? { userId: "user1", currency: "USD", status: "PENDING" },
        }),
        update,
      }),
    };
  });

  return update;
};

beforeEach(() => {
  jest.clearAllMocks();
  getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
});

describe("PATCH /api/transactions/[id]", () => {
  it("returns 404 for a missing doc", async () => {
    wireDoc({ exists: false });
    const res = mockRes();
    await handler(
      {
        method: "PATCH",
        query: { id: "tx1" },
        body: { status: "PAID" },
      } as unknown as NextApiRequest,
      res
    );
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("returns 403 for someone else's transaction", async () => {
    wireDoc({ data: { userId: "intruder", currency: "USD" } });
    const res = mockRes();
    await handler(
      {
        method: "PATCH",
        query: { id: "tx1" },
        body: { status: "PAID" },
      } as unknown as NextApiRequest,
      res
    );
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("updates the status", async () => {
    const update = wireDoc({});
    const res = mockRes();
    await handler(
      {
        method: "PATCH",
        query: { id: "tx1" },
        body: { status: "PAID" },
      } as unknown as NextApiRequest,
      res
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(update).toHaveBeenCalledWith({ status: "PAID" });
  });

  it("rejects an empty patch", async () => {
    wireDoc({});
    const res = mockRes();
    await handler(
      { method: "PATCH", query: { id: "tx1" }, body: {} } as unknown as NextApiRequest,
      res
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("rejects a charged pair colliding with the doc's currency", async () => {
    wireDoc({ data: { userId: "user1", currency: "COP" } });
    const res = mockRes();
    await handler(
      {
        method: "PATCH",
        query: { id: "tx1" },
        body: { chargedAmount: 100, chargedCurrency: "COP" },
      } as unknown as NextApiRequest,
      res
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("clears the charged pair when both come as null", async () => {
    const update = wireDoc({});
    const res = mockRes();
    await handler(
      {
        method: "PATCH",
        query: { id: "tx1" },
        body: { chargedAmount: null, chargedCurrency: null },
      } as unknown as NextApiRequest,
      res
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(update).toHaveBeenCalledWith({
      chargedAmount: "DELETE_FIELD",
      chargedCurrency: "DELETE_FIELD",
    });
  });
});

describe("DELETE /api/transactions/[id]", () => {
  it("soft deletes by marking the transaction SKIPPED", async () => {
    const update = wireDoc({});
    const res = mockRes();
    await handler({ method: "DELETE", query: { id: "tx1" } } as unknown as NextApiRequest, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(update).toHaveBeenCalledWith({ status: "SKIPPED" });
  });

  it("returns 405 for other methods", async () => {
    wireDoc({});
    const res = mockRes();
    await handler({ method: "GET", query: { id: "tx1" } } as unknown as NextApiRequest, res);
    expect(res.setHeader).toHaveBeenCalledWith("Allow", "PATCH, DELETE");
    expect(res.status).toHaveBeenCalledWith(405);
  });
});

describe("PATCH /api/transactions/[id] — category and currency", () => {
  const wire = (category: { exists: boolean; data?: Record<string, unknown> }) => {
    const update = jest.fn().mockResolvedValue(undefined);
    collectionMock.mockImplementation((name: string) => {
      if (name === "categories") {
        return {
          doc: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({
              exists: category.exists,
              data: () => category.data ?? { userId: "user1", domain: "EXPENSE" },
            }),
          }),
        };
      }
      return {
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({
            exists: true,
            data: () => ({
              userId: "user1",
              domain: "EXPENSE",
              currency: "USD",
              chargedCurrency: "COP",
              status: "PAID",
            }),
          }),
          update,
        }),
      };
    });
    return update;
  };

  const patch = async (body: Record<string, unknown>) => {
    const res = mockRes();
    await handler(
      { method: "PATCH", query: { id: "tx1" }, body } as unknown as NextApiRequest,
      res
    );
    return res;
  };

  it("moves the transaction to another category of the same domain", async () => {
    const update = wire({ exists: true });
    const res = await patch({ categoryId: "food", currency: "EUR" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(update).toHaveBeenCalledWith({ categoryId: "food", currency: "EUR" });
  });

  it("rejects a category from another domain or another user", async () => {
    wire({ exists: true, data: { userId: "user1", domain: "INCOME" } });
    expect((await patch({ categoryId: "salary" })).status).toHaveBeenCalledWith(400);

    wire({ exists: true, data: { userId: "intruder", domain: "EXPENSE" } });
    expect((await patch({ categoryId: "theirs" })).status).toHaveBeenCalledWith(403);
  });

  it("rejects a new currency equal to the stored charged currency", async () => {
    wire({ exists: true });
    expect((await patch({ currency: "COP" })).status).toHaveBeenCalledWith(400);
  });
});

describe("PATCH /api/transactions/[id] — tags and note", () => {
  const mk = (method: string, body?: unknown) =>
    ({ method, query: { id: "t1" }, body }) as unknown as NextApiRequest;
  it("validates new tags and clears both with null or an empty list", async () => {
    let update = wireDoc({});
    getAllMock.mockResolvedValue([{ exists: true, data: () => ({ userId: "user1" }) }]);
    let res = mockRes();
    await handler(mk("PATCH", { tags: ["tag1"], note: "Paid late" }), res);
    expect(update).toHaveBeenCalledWith({ tags: ["tag1"], note: "Paid late" });

    update = wireDoc({});
    res = mockRes();
    await handler(mk("PATCH", { tags: [], note: null }), res);
    expect(getAllMock).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith({ tags: "DELETE_FIELD", note: "DELETE_FIELD" });
  });
});
