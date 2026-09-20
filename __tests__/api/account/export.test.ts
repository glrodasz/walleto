import type { NextApiRequest, NextApiResponse } from "next";

const getSessionMock = jest.fn();
const collectUserDataMock = jest.fn();

jest.mock("../../../lib/auth0", () => ({
  __esModule: true,
  default: {
    withApiAuthRequired: (fn: unknown) => fn,
    getSession: (...args: unknown[]) => getSessionMock(...args),
  },
}));
jest.mock("../../../firebase/admin", () => ({
  __esModule: true,
  default: { firestore: jest.fn(() => "DB") },
}));
jest.mock("../../../helpers/userData", () => ({
  collectUserData: (...args: unknown[]) => collectUserDataMock(...args),
}));

import handler from "../../../pages/api/account/export";

const mockRes = () => {
  const res = {} as NextApiResponse;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  getSessionMock.mockReset();
  collectUserDataMock.mockReset();
});

describe("GET /api/account/export", () => {
  it("returns 401 when unauthenticated", async () => {
    getSessionMock.mockResolvedValue(null);
    const res = mockRes();
    await handler({ method: "GET", query: {} } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 405 for other verbs", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
    const res = mockRes();
    await handler({ method: "POST", query: {} } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.setHeader).toHaveBeenCalledWith("Allow", "GET");
  });

  it("sends the collected data as a downloadable JSON file", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
    const data = { exportedAt: "2026-09-20T10:00:00.000Z", userId: "user1", collections: {} };
    collectUserDataMock.mockResolvedValue(data);
    const res = mockRes();

    await handler({ method: "GET", query: {} } as NextApiRequest, res);

    expect(collectUserDataMock).toHaveBeenCalledWith("DB", "user1");
    expect(res.setHeader).toHaveBeenCalledWith(
      "Content-Disposition",
      'attachment; filename="waletto-export-2026-09-20.json"'
    );
    expect(res.setHeader).toHaveBeenCalledWith("Cache-Control", "no-store");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(JSON.parse((res.send as jest.Mock).mock.calls[0][0])).toEqual(data);
  });
});
