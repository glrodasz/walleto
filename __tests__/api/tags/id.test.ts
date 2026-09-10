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
  default: { firestore: jest.fn(() => ({ collection: collectionMock })) },
}));

import handler from "../../../pages/api/tags/[id]";

const mockRes = () => {
  const res = {} as NextApiResponse;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
};

const wire = (
  data: Record<string, unknown> | undefined,
  opts: { exists?: boolean; others?: { id: string; data: () => Record<string, unknown> }[] } = {}
) => {
  const update = jest.fn().mockResolvedValue(undefined);
  collectionMock.mockReturnValue({
    doc: jest.fn(() => ({
      get: jest.fn().mockResolvedValue({ exists: opts.exists ?? true, data: () => data }),
      update,
    })),
    where: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue({ docs: opts.others ?? [] }),
  });
  return update;
};

const req = (method: string, body?: unknown) =>
  ({ method, query: { id: "t1" }, body }) as unknown as NextApiRequest;

beforeEach(() => {
  jest.clearAllMocks();
  getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
});

describe("PATCH /api/tags/[id]", () => {
  it("returns 404 / 403 for a missing or foreign tag", async () => {
    wire(undefined, { exists: false });
    let res = mockRes();
    await handler(req("PATCH", { name: "x" }), res);
    expect(res.status).toHaveBeenCalledWith(404);

    wire({ userId: "intruder" });
    res = mockRes();
    await handler(req("PATCH", { name: "x" }), res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("renames, re-deriving the key", async () => {
    const update = wire({ userId: "user1", name: "Old", key: "old" });
    const res = mockRes();
    await handler(req("PATCH", { name: "Trip 2026" }), res);
    expect(update).toHaveBeenCalledWith({ name: "Trip2026", key: "trip2026" });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("refuses a rename that collides with another live tag", async () => {
    wire(
      { userId: "user1", name: "Old", key: "old" },
      { others: [{ id: "t2", data: () => ({ name: "Trip2026", archived: false }) }] }
    );
    const res = mockRes();
    await handler(req("PATCH", { name: "trip2026" }), res);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it("ignores its own doc in the collision check and rejects an empty patch", async () => {
    const update = wire(
      { userId: "user1", name: "Trip2026", key: "trip2026" },
      { others: [{ id: "t1", data: () => ({ name: "Trip2026", archived: false }) }] }
    );
    let res = mockRes();
    await handler(req("PATCH", { name: "TRIP2026" }), res);
    expect(update).toHaveBeenCalledWith({ name: "TRIP2026", key: "trip2026" });

    res = mockRes();
    await handler(req("PATCH", {}), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe("DELETE /api/tags/[id]", () => {
  it("soft-archives", async () => {
    const update = wire({ userId: "user1" });
    const res = mockRes();
    await handler(req("DELETE"), res);
    expect(update).toHaveBeenCalledWith({ archived: true });
  });
});

describe("unsupported methods", () => {
  it("returns 405", async () => {
    wire({ userId: "user1" });
    const res = mockRes();
    await handler(req("GET"), res);
    expect(res.status).toHaveBeenCalledWith(405);
  });
});
