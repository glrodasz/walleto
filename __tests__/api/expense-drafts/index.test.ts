import type { NextApiRequest, NextApiResponse } from "next";

const getSessionMock = jest.fn();
const txGet = jest.fn();
const txSet = jest.fn();
const txUpdate = jest.fn();
const docMock = jest.fn((id: string) => ({ id }));

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
    firestore: jest.fn(() => ({
      collection: jest.fn(() => ({ doc: docMock })),
      runTransaction: (fn: (tx: unknown) => unknown) =>
        fn({ get: txGet, set: txSet, update: txUpdate }),
    })),
  },
}));

import create from "../../../pages/api/expense-drafts/index";
import remove from "../../../pages/api/expense-drafts/[id]";
import { MAX_DRAFTS } from "../../../helpers/drafts";

const mockRes = () => {
  const res = {} as NextApiResponse;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
};
const withDrafts = (expenseDrafts?: unknown[]) =>
  txGet.mockResolvedValue({ data: () => (expenseDrafts ? { expenseDrafts } : {}) });

beforeEach(() => {
  jest.clearAllMocks();
  getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
  withDrafts();
});

describe("POST /api/expense-drafts", () => {
  it("returns 401 when unauthenticated", async () => {
    getSessionMock.mockResolvedValue(null);
    const res = mockRes();
    await create({ method: "POST", body: { name: "Netflix" } } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("saves a name-only draft on the caller's user doc", async () => {
    const res = mockRes();
    await create({ method: "POST", body: { name: "  Netflix " } } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(docMock).toHaveBeenCalledWith("user1");
    const [, data, opts] = txSet.mock.calls[0];
    expect(opts).toEqual({ merge: true });
    expect(data.expenseDrafts).toHaveLength(1);
    expect(data.expenseDrafts[0]).toMatchObject({ name: "Netflix" });
    expect(data.expenseDrafts[0]).not.toHaveProperty("amount");
    expect(data.expenseDrafts[0]).not.toHaveProperty("frequency");
  });

  it("appends to the drafts already there and keeps only the date part the cadence uses", async () => {
    withDrafts([{ id: "old", name: "Gym", createdAt: "2026-11-01T00:00:00.000Z" }]);
    const res = mockRes();
    await create(
      {
        method: "POST",
        body: {
          name: "Spotify",
          amount: 11.99,
          currency: "USD",
          frequency: "MONTHLY",
          dayOfMonth: 14,
          date: "2026-11-14",
        },
      } as NextApiRequest,
      res
    );
    const drafts = txSet.mock.calls[0][1].expenseDrafts;
    expect(drafts.map((d: { name: string }) => d.name)).toEqual(["Gym", "Spotify"]);
    expect(drafts[1]).toMatchObject({ amount: 11.99, currency: "USD", dayOfMonth: 14 });
    expect(drafts[1]).not.toHaveProperty("date");
  });

  it("rejects a draft without a name, or an amount without a currency", async () => {
    for (const body of [{ name: " " }, { name: "X", amount: 5 }]) {
      const res = mockRes();
      await create({ method: "POST", body } as NextApiRequest, res);
      expect(res.status).toHaveBeenCalledWith(400);
    }
    expect(txSet).not.toHaveBeenCalled();
  });

  it("refuses past the cap", async () => {
    withDrafts(Array.from({ length: MAX_DRAFTS }, (_, i) => ({ id: String(i) })));
    const res = mockRes();
    await create({ method: "POST", body: { name: "One more" } } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(txSet).not.toHaveBeenCalled();
  });

  it("only accepts POST", async () => {
    const res = mockRes();
    await create({ method: "GET" } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(405);
  });
});

describe("DELETE /api/expense-drafts/[id]", () => {
  it("drops that draft and keeps the rest", async () => {
    withDrafts([{ id: "a" }, { id: "b" }]);
    const res = mockRes();
    await remove({ method: "DELETE", query: { id: "a" } } as unknown as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(txUpdate.mock.calls[0][1]).toEqual({ expenseDrafts: [{ id: "b" }] });
  });

  it("returns 404 for a draft that isn't there", async () => {
    withDrafts([{ id: "a" }]);
    const res = mockRes();
    await remove({ method: "DELETE", query: { id: "zzz" } } as unknown as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(txUpdate).not.toHaveBeenCalled();
  });
});
