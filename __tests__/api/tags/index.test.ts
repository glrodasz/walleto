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
      }
    ),
  },
}));

import handler from "../../../pages/api/tags/index";

const mockRes = () => {
  const res = {} as NextApiResponse;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
};

type Doc = { id: string; data: () => Record<string, unknown>; ref?: { update: jest.Mock } };
const wire = (docs: Doc[] = []) => {
  const add = jest.fn().mockResolvedValue({ id: "tag-new" });
  const chain = {
    where: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue({ docs }),
    add,
  };
  collectionMock.mockReturnValue(chain);
  return { chain, add };
};

beforeEach(() => {
  jest.clearAllMocks();
  getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
});

describe("GET /api/tags", () => {
  it("returns 401 when unauthenticated", async () => {
    getSessionMock.mockResolvedValue(null);
    const res = mockRes();
    await handler({ method: "GET", query: {} } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("lists the user's live tags", async () => {
    wire([{ id: "t1", data: () => ({ name: "Trip2026", key: "trip2026" }) }]);
    const res = mockRes();
    await handler({ method: "GET", query: {} } as NextApiRequest, res);
    expect(res.json).toHaveBeenCalledWith([{ id: "t1", name: "Trip2026", key: "trip2026" }]);
  });
});

describe("POST /api/tags", () => {
  it("rejects an empty name", async () => {
    wire();
    const res = mockRes();
    await handler({ method: "POST", query: {}, body: { name: "   " } } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("stores the whitespace-free name with its lowercase key", async () => {
    const { chain, add } = wire();
    const res = mockRes();
    await handler(
      { method: "POST", query: {}, body: { name: " Trip 2026 " } } as NextApiRequest,
      res
    );
    expect(chain.where).toHaveBeenCalledWith("key", "==", "trip2026");
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: "tag-new" });
    expect(add).toHaveBeenCalledWith({
      userId: "user1",
      name: "Trip2026",
      key: "trip2026",
      archived: false,
      createdAt: "SERVER_TIMESTAMP",
    });
  });

  it("returns 409 when a live tag already has that key, whatever the spelling", async () => {
    wire([{ id: "t1", data: () => ({ name: "Trip2026", archived: false }) }]);
    const res = mockRes();
    await handler(
      { method: "POST", query: {}, body: { name: "trip 2026" } } as NextApiRequest,
      res
    );
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'You already have a tag called "Trip2026"' });
  });

  it("revives an archived tag with the same key instead of creating a second one", async () => {
    const update = jest.fn().mockResolvedValue(undefined);
    const { add } = wire([
      { id: "old", data: () => ({ name: "trip2026", archived: true }), ref: { update } },
    ]);
    const res = mockRes();
    await handler({ method: "POST", query: {}, body: { name: "Trip2026" } } as NextApiRequest, res);
    expect(update).toHaveBeenCalledWith({ name: "Trip2026", archived: false });
    expect(add).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: "old" });
  });
});

describe("unsupported methods", () => {
  it("returns 405", async () => {
    wire();
    const res = mockRes();
    await handler({ method: "PUT", query: {} } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(405);
  });
});
