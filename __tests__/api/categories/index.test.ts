import type { NextApiRequest, NextApiResponse } from "next";

const getSessionMock = jest.fn();

const existingQueryMock = jest.fn();
const addMock = jest.fn();
const getListMock = jest.fn();

const collectionMock = jest.fn();
const whereMock = jest.fn();
const limitMock = jest.fn();

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
      }
    ),
  },
}));

import handler from "../../../pages/api/categories/index";

const mockRes = () => {
  const res = {} as NextApiResponse;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
};

const buildChain = (overrides: { get?: jest.Mock; add?: jest.Mock } = {}) => {
  const chain = {
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    get: overrides.get ?? jest.fn().mockResolvedValue({ empty: true, docs: [] }),
    add: overrides.add ?? addMock,
  };
  collectionMock.mockReturnValue(chain);
  return chain;
};

describe("GET /api/categories", () => {
  beforeEach(() => {
    getSessionMock.mockReset();
  });

  it("returns 401 when unauthenticated", async () => {
    getSessionMock.mockResolvedValue(null);
    const res = mockRes();
    await handler({ method: "GET", query: {} } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns categories for the user", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
    const doc = { id: "cat1", data: () => ({ name: "Salary", domain: "INCOME" }) };
    buildChain({ get: jest.fn().mockResolvedValue({ docs: [doc] }) });
    const res = mockRes();
    await handler({ method: "GET", query: {} } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([{ id: "cat1", name: "Salary", domain: "INCOME" }]);
  });
});

describe("POST /api/categories", () => {
  beforeEach(() => {
    getSessionMock.mockReset();
    addMock.mockReset();
  });

  it("returns 400 for invalid body", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
    buildChain();
    const res = mockRes();
    await handler(
      { method: "POST", query: {}, body: { domain: "INVALID" } } as NextApiRequest,
      res
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 409 when category already exists", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
    buildChain({
      get: jest.fn().mockResolvedValue({ empty: false, docs: [{ id: "existing" }] }),
    });
    const res = mockRes();
    await handler(
      {
        method: "POST",
        query: {},
        body: { domain: "INCOME", name: "Salary" },
      } as NextApiRequest,
      res
    );
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it("creates a new category and returns 201", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
    buildChain({
      get: jest.fn().mockResolvedValue({ empty: true, docs: [] }),
      add: jest.fn().mockResolvedValue({ id: "new-cat" }),
    });
    const res = mockRes();
    await handler(
      {
        method: "POST",
        query: {},
        body: { domain: "INCOME", name: "Freelance" },
      } as NextApiRequest,
      res
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: "new-cat" });
  });
});
