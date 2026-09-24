import type { NextApiRequest, NextApiResponse } from "next";

const getSessionMock = jest.fn();
const collectionMock = jest.fn();
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
        batch: jest.fn(() => ({ update: batchUpdateMock, commit: batchCommitMock })),
      })),
      {
        FieldValue: {
          serverTimestamp: jest.fn(() => "SERVER_TIMESTAMP"),
          delete: jest.fn(() => "DELETE_FIELD"),
        },
      }
    ),
  },
}));

import handler from "../../../pages/api/recurrent-transactions/[id]/convert";

const mockRes = () => {
  const res = {} as NextApiResponse;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
};

const wire = (opts: {
  exists?: boolean;
  item?: Record<string, unknown>;
  category?: { exists: boolean; data?: Record<string, unknown> };
  account?: { exists: boolean; data?: Record<string, unknown> };
}) => {
  const update = jest.fn().mockResolvedValue(undefined);
  collectionMock.mockImplementation((name: string) => {
    if (name === "categories") {
      return {
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({
            exists: opts.category?.exists ?? true,
            data: () => opts.category?.data ?? { userId: "user1", domain: "DEBT" },
          }),
        }),
      };
    }
    if (name === "accounts") {
      return {
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({
            exists: opts.account?.exists ?? true,
            data: () => opts.account?.data ?? { userId: "user1", domain: "DEBT" },
          }),
        }),
      };
    }
    if (name === "transactions") {
      return {
        where: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({ docs: linkedRows }),
      };
    }
    return {
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({
          exists: opts.exists ?? true,
          data: () => opts.item ?? { userId: "user1", domain: "EXPENSE", categoryId: "credits" },
        }),
        update,
      }),
    };
  });
  return update;
};

const post = (body: Record<string, unknown>) =>
  ({ method: "POST", query: { id: "car" }, body }) as unknown as NextApiRequest;
const body = { domain: "DEBT", categoryId: "loans", accountId: "visa" };

beforeEach(() => {
  jest.clearAllMocks();
  linkedRows = [{ ref: "row1" }, { ref: "row2" }];
  getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
});

describe("POST /api/recurrent-transactions/[id]/convert", () => {
  it("returns 401 without a session", async () => {
    getSessionMock.mockResolvedValue(null);
    const res = mockRes();
    await handler(post(body), res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("moves the item and every row it wrote under the debt", async () => {
    const update = wire({});
    const res = mockRes();
    await handler(post(body), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ id: "car", updated: 2 });
    expect(update).toHaveBeenCalledWith({
      domain: "DEBT",
      categoryId: "loans",
      accountId: "visa",
      type: "LOAN_PAYMENT",
    });
    expect(batchUpdateMock).toHaveBeenCalledTimes(2);
    expect(batchUpdateMock).toHaveBeenCalledWith("row1", {
      domain: "DEBT",
      categoryId: "loans",
      accountId: "visa",
    });
    expect(batchCommitMock).toHaveBeenCalledTimes(1);
  });

  it("clears the account when none is named — the Unassigned bucket", async () => {
    const update = wire({});
    await handler(post({ domain: "DEBT", categoryId: "loans" }), mockRes());
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ accountId: "DELETE_FIELD" }));
    expect(batchUpdateMock).toHaveBeenCalledWith(
      "row1",
      expect.objectContaining({ accountId: "DELETE_FIELD" })
    );
  });

  it("returns 404 / 403 for a missing or foreign item", async () => {
    wire({ exists: false });
    const missing = mockRes();
    await handler(post(body), missing);
    expect(missing.status).toHaveBeenCalledWith(404);

    wire({ item: { userId: "intruder", domain: "EXPENSE" } });
    const foreign = mockRes();
    await handler(post(body), foreign);
    expect(foreign.status).toHaveBeenCalledWith(403);
  });

  it("only converts an expense", async () => {
    wire({ item: { userId: "user1", domain: "SAVING" } });
    const res = mockRes();
    await handler(post(body), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(batchUpdateMock).not.toHaveBeenCalled();
  });

  it("rejects a category or an account outside Debts, and a bad body", async () => {
    wire({ category: { exists: true, data: { userId: "user1", domain: "EXPENSE" } } });
    const cat = mockRes();
    await handler(post(body), cat);
    expect(cat.status).toHaveBeenCalledWith(400);

    wire({ account: { exists: true, data: { userId: "user1", domain: "SAVING" } } });
    const acc = mockRes();
    await handler(post(body), acc);
    expect(acc.status).toHaveBeenCalledWith(400);

    wire({});
    const bad = mockRes();
    await handler(post({ domain: "SAVING", categoryId: "x" }), bad);
    expect(bad.status).toHaveBeenCalledWith(400);
  });

  it("returns 405 for other methods", async () => {
    wire({});
    const res = mockRes();
    await handler({ method: "GET", query: { id: "car" } } as unknown as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.setHeader).toHaveBeenCalledWith("Allow", "POST");
  });
});
