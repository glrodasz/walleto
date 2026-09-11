import type { NextApiRequest, NextApiResponse } from "next";

const getSessionMock = jest.fn();

jest.mock("../../../lib/auth0", () => ({
  __esModule: true,
  default: {
    withApiAuthRequired: (fn: unknown) => fn,
    getSession: (...args: unknown[]) => getSessionMock(...args),
  },
}));
jest.mock("../../../firebase/admin", () => ({ __esModule: true, default: {} }));
jest.mock("../../../helpers/seedDefaultCategories");

import handler from "../../../pages/api/categories/defaults";
import { seedDefaultCategories } from "../../../helpers/seedDefaultCategories";

const seedMock = seedDefaultCategories as jest.MockedFunction<typeof seedDefaultCategories>;

const mockRes = () => {
  const res = {} as NextApiResponse;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  getSessionMock.mockReset();
  seedMock.mockReset().mockResolvedValue(0);
});

describe("POST /api/categories/defaults", () => {
  it("returns 401 when unauthenticated", async () => {
    getSessionMock.mockResolvedValue(null);
    const res = mockRes();
    await handler({ method: "POST", query: {} } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(seedMock).not.toHaveBeenCalled();
  });

  it("seeds for the session user and reports how many were created", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
    seedMock.mockResolvedValue(3);
    const res = mockRes();
    await handler({ method: "POST", query: {} } as NextApiRequest, res);
    expect(seedMock).toHaveBeenCalledWith("user1");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ created: 3 });
  });

  it("reports zero when the user already has every default", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
    seedMock.mockResolvedValue(0);
    const res = mockRes();
    await handler({ method: "POST", query: {} } as NextApiRequest, res);
    expect(res.json).toHaveBeenCalledWith({ created: 0 });
  });

  it("returns 405 for GET", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
    const res = mockRes();
    await handler({ method: "GET", query: {} } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.setHeader).toHaveBeenCalledWith("Allow", "POST");
  });
});
