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
    firestore: jest.fn(() => ({ collection: collectionMock })),
  },
}));

import handler from "../../../pages/api/payment-methods/[id]";

const mockRes = () => {
  const res = {} as NextApiResponse;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
};

const wireDoc = (data: Record<string, unknown> | undefined, opts: { exists?: boolean } = {}) => {
  const update = jest.fn().mockResolvedValue(undefined);
  collectionMock.mockReturnValue({
    doc: jest.fn(() => ({
      get: jest.fn().mockResolvedValue({ exists: opts.exists ?? true, data: () => data }),
      update,
    })),
  });
  return update;
};

const req = (method: string, body?: unknown) =>
  ({ method, query: { id: "pm1" }, body }) as unknown as NextApiRequest;

beforeEach(() => {
  jest.clearAllMocks();
  getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
});

describe("PATCH /api/payment-methods/[id]", () => {
  it("returns 401 without a session", async () => {
    getSessionMock.mockResolvedValue(null);
    const res = mockRes();
    await handler(req("PATCH", { name: "New name" }), res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 404 for a missing doc", async () => {
    wireDoc(undefined, { exists: false });
    const res = mockRes();
    await handler(req("PATCH", { name: "New name" }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("returns 403 for someone else's method", async () => {
    wireDoc({ userId: "intruder" });
    const res = mockRes();
    await handler(req("PATCH", { name: "New name" }), res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("rejects an invalid body", async () => {
    wireDoc({ userId: "user1" });
    const res = mockRes();
    await handler(req("PATCH", { name: "" }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("updates editable fields", async () => {
    const update = wireDoc({ userId: "user1" });
    const res = mockRes();
    await handler(
      req("PATCH", { name: "Renamed", network: "Visa", last4: "1234", defaultCurrency: "EUR" }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(update).toHaveBeenCalledWith({
      name: "Renamed",
      network: "Visa",
      last4: "1234",
      defaultCurrency: "EUR",
    });
  });
});

describe("DELETE /api/payment-methods/[id]", () => {
  it("archives instead of deleting", async () => {
    const update = wireDoc({ userId: "user1" });
    const res = mockRes();
    await handler(req("DELETE"), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(update).toHaveBeenCalledWith({ archived: true });
  });

  it("returns 405 for other methods", async () => {
    wireDoc({ userId: "user1" });
    const res = mockRes();
    await handler(req("GET"), res);
    expect(res.setHeader).toHaveBeenCalledWith("Allow", "PATCH, DELETE");
    expect(res.status).toHaveBeenCalledWith(405);
  });
});
