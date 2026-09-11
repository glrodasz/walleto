import type { NextApiRequest, NextApiResponse } from "next";

const getSessionMock = jest.fn();
const docGetMock = jest.fn();
const docUpdateMock = jest.fn();
const depQueryGetMock = jest.fn();

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
        collection: jest.fn((name: string) => {
          if (name === "categories") {
            return {
              doc: jest.fn(() => ({
                get: docGetMock,
                update: docUpdateMock,
              })),
            };
          }
          // recurringItems dependency check
          return {
            where: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            get: depQueryGetMock,
          };
        }),
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

import handler from "../../../pages/api/categories/[id]";

const mockRes = () => {
  const res = {} as NextApiResponse;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
};

describe("PATCH /api/categories/[id]", () => {
  beforeEach(() => {
    getSessionMock.mockReset();
    docGetMock.mockReset();
    docUpdateMock.mockReset().mockResolvedValue(undefined);
    depQueryGetMock.mockReset().mockResolvedValue({ empty: true });
  });

  it("returns 403 when user does not own the category", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "other-user" } });
    docGetMock.mockResolvedValue({ exists: true, data: () => ({ userId: "owner" }) });
    const res = mockRes();
    await handler(
      {
        method: "PATCH",
        query: { id: "cat1" },
        body: { name: "New" },
      } as unknown as NextApiRequest,
      res
    );
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("returns 400 for invalid body", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
    docGetMock.mockResolvedValue({ exists: true, data: () => ({ userId: "user1" }) });
    const res = mockRes();
    await handler(
      {
        method: "PATCH",
        query: { id: "cat1" },
        body: { name: "" },
      } as unknown as NextApiRequest,
      res
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("updates name and clears isDefault flag", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
    docGetMock.mockResolvedValue({ exists: true, data: () => ({ userId: "user1" }) });
    const res = mockRes();
    await handler(
      {
        method: "PATCH",
        query: { id: "cat1" },
        body: { name: "Renamed" },
      } as unknown as NextApiRequest,
      res
    );
    expect(docUpdateMock).toHaveBeenCalledWith({ name: "Renamed", isDefault: false });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("stores a picked icon and removes the field when cleared", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
    docGetMock.mockResolvedValue({ exists: true, data: () => ({ userId: "user1" }) });
    await handler(
      {
        method: "PATCH",
        query: { id: "cat1" },
        body: { icon: "plane" },
      } as unknown as NextApiRequest,
      mockRes()
    );
    expect(docUpdateMock).toHaveBeenCalledWith({ icon: "plane" });

    await handler(
      { method: "PATCH", query: { id: "cat1" }, body: { icon: null } } as unknown as NextApiRequest,
      mockRes()
    );
    expect(docUpdateMock).toHaveBeenLastCalledWith({ icon: "DELETE_FIELD" });

    const res = mockRes();
    await handler(
      {
        method: "PATCH",
        query: { id: "cat1" },
        body: { icon: "nope" },
      } as unknown as NextApiRequest,
      res
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe("DELETE /api/categories/[id]", () => {
  beforeEach(() => {
    getSessionMock.mockReset();
    docGetMock.mockReset();
    docUpdateMock.mockReset().mockResolvedValue(undefined);
    depQueryGetMock.mockReset().mockResolvedValue({ empty: true });
  });

  it("soft-deletes by setting archived: true", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
    docGetMock.mockResolvedValue({ exists: true, data: () => ({ userId: "user1" }) });
    const res = mockRes();
    await handler(
      { method: "DELETE", query: { id: "cat1" }, body: {} } as unknown as NextApiRequest,
      res
    );
    expect(docUpdateMock).toHaveBeenCalledWith({ archived: true });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("sets X-Has-Dependencies header when recurring items reference the category", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
    docGetMock.mockResolvedValue({ exists: true, data: () => ({ userId: "user1" }) });
    depQueryGetMock.mockResolvedValue({ empty: false });
    const res = mockRes();
    await handler(
      { method: "DELETE", query: { id: "cat1" }, body: {} } as unknown as NextApiRequest,
      res
    );
    expect(res.setHeader).toHaveBeenCalledWith("X-Has-Dependencies", "true");
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
