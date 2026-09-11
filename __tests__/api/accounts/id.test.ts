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
      }
    ),
  },
}));

import handler from "../../../pages/api/accounts/[id]";

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
  ({ method, query: { id: "acc1" }, body }) as unknown as NextApiRequest;

beforeEach(() => {
  jest.clearAllMocks();
  getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
});

describe("PATCH /api/accounts/[id]", () => {
  it("returns 404 for a missing doc", async () => {
    wireDoc(undefined, { exists: false });
    const res = mockRes();
    await handler(req("PATCH", { name: "New" }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("returns 403 for someone else's account", async () => {
    wireDoc({ userId: "intruder" });
    const res = mockRes();
    await handler(req("PATCH", { name: "New" }), res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("rejects an empty body", async () => {
    wireDoc({ userId: "user1" });
    const res = mockRes();
    await handler(req("PATCH", {}), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("updates fields and clears the rate with null", async () => {
    const update = wireDoc({ userId: "user1" });
    const res = mockRes();
    await handler(req("PATCH", { name: "Renamed", interestRate: null, provider: "" }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(update).toHaveBeenCalledWith({
      name: "Renamed",
      interestRate: "DELETE_FIELD",
      provider: "DELETE_FIELD",
    });
  });

  it("sets a new rate", async () => {
    const update = wireDoc({ userId: "user1" });
    const res = mockRes();
    await handler(req("PATCH", { interestRate: { value: 0.3, period: "MONTHLY" } }), res);
    expect(update).toHaveBeenCalledWith({ interestRate: { value: 0.3, period: "MONTHLY" } });
  });
});

describe("DELETE /api/accounts/[id]", () => {
  it("soft-archives", async () => {
    const update = wireDoc({ userId: "user1" });
    const res = mockRes();
    await handler(req("DELETE"), res);
    expect(update).toHaveBeenCalledWith({ archived: true });
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe("unsupported methods", () => {
  it("returns 405", async () => {
    wireDoc({ userId: "user1" });
    const res = mockRes();
    await handler(req("GET"), res);
    expect(res.status).toHaveBeenCalledWith(405);
  });
});
