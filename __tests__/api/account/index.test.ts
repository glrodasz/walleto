import type { NextApiRequest, NextApiResponse } from "next";

const getSessionMock = jest.fn();
const deleteUserDataMock = jest.fn();
const deleteFirebaseUserMock = jest.fn();
const deleteAuth0UserMock = jest.fn();
const configuredMock = jest.fn();

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
jest.mock("firebase-admin/auth", () => ({
  getAuth: () => ({ deleteUser: (...a: unknown[]) => deleteFirebaseUserMock(...a) }),
}));
jest.mock("../../../helpers/userData", () => ({
  deleteUserData: (...args: unknown[]) => deleteUserDataMock(...args),
}));
jest.mock("../../../lib/auth0Management", () => ({
  isAuth0ManagementConfigured: () => configuredMock(),
  deleteAuth0User: (...args: unknown[]) => deleteAuth0UserMock(...args),
}));

import handler from "../../../pages/api/account";

const mockRes = () => {
  const res = {} as NextApiResponse;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
};

const counts = { users: 1, transactions: 12 };

beforeEach(() => {
  getSessionMock.mockReset().mockResolvedValue({ user: { sub: "user1" } });
  deleteUserDataMock.mockReset().mockResolvedValue(counts);
  deleteFirebaseUserMock.mockReset().mockResolvedValue(undefined);
  deleteAuth0UserMock.mockReset().mockResolvedValue(undefined);
  configuredMock.mockReset().mockReturnValue(false);
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  (console.error as jest.Mock).mockRestore();
});

describe("DELETE /api/account", () => {
  it("returns 401 when unauthenticated", async () => {
    getSessionMock.mockResolvedValue(null);
    const res = mockRes();
    await handler({ method: "DELETE", query: {} } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(deleteUserDataMock).not.toHaveBeenCalled();
  });

  it("returns 405 for other verbs", async () => {
    const res = mockRes();
    await handler({ method: "GET", query: {} } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.setHeader).toHaveBeenCalledWith("Allow", "DELETE");
  });

  it("erases Firestore and Firebase Auth, and reports the identity as kept when Auth0 is not configured", async () => {
    const res = mockRes();
    await handler({ method: "DELETE", query: {} } as NextApiRequest, res);

    expect(deleteUserDataMock).toHaveBeenCalledWith("DB", "user1");
    expect(deleteFirebaseUserMock).toHaveBeenCalledWith("user1");
    expect(deleteAuth0UserMock).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ deleted: counts, identityDeleted: false });
  });

  it("also deletes the Auth0 identity when the Management API is configured", async () => {
    configuredMock.mockReturnValue(true);
    const res = mockRes();
    await handler({ method: "DELETE", query: {} } as NextApiRequest, res);

    expect(deleteAuth0UserMock).toHaveBeenCalledWith("user1");
    expect(res.json).toHaveBeenCalledWith({ deleted: counts, identityDeleted: true });
  });

  it("tolerates a Firebase Auth user that was never created", async () => {
    deleteFirebaseUserMock.mockRejectedValue({ code: "auth/user-not-found" });
    const res = mockRes();
    await handler({ method: "DELETE", query: {} } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("returns 500 when any step fails", async () => {
    deleteFirebaseUserMock.mockRejectedValue(new Error("boom"));
    const res = mockRes();
    await handler({ method: "DELETE", query: {} } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
