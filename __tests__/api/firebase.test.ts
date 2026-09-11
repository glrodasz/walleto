import type { NextApiRequest, NextApiResponse } from "next";

const getSessionMock = jest.fn();
const createCustomTokenMock = jest.fn();
const getAppsMock = jest.fn();
const userDocGetMock = jest.fn();
const userDocSetMock = jest.fn();
const batchCommitMock = jest.fn();

jest.mock("../../lib/auth0", () => ({
  __esModule: true,
  default: {
    withApiAuthRequired: (fn: unknown) => fn,
    getSession: (...args: unknown[]) => getSessionMock(...args),
  },
}));
jest.mock("../../firebase/admin", () => ({
  __esModule: true,
  default: {
    firestore: Object.assign(
      jest.fn(() => ({
        collection: jest.fn(() => ({
          doc: jest.fn(() => ({
            get: userDocGetMock,
            set: userDocSetMock,
          })),
        })),
        batch: jest.fn(() => ({ set: jest.fn(), commit: batchCommitMock })),
      })),
      {
        FieldValue: { serverTimestamp: jest.fn(() => "SERVER_TIMESTAMP") },
      }
    ),
  },
}));
jest.mock("../../helpers/seedDefaultCategories");
jest.mock("firebase-admin/app", () => ({ getApps: () => getAppsMock() }));
jest.mock("firebase-admin/auth", () => ({
  getAuth: () => ({ createCustomToken: (...a: unknown[]) => createCustomTokenMock(...a) }),
}));

import handler from "../../pages/api/firebase";
import { seedDefaultCategories } from "../../helpers/seedDefaultCategories";

const seedDefaultCategoriesMock = seedDefaultCategories as jest.MockedFunction<
  typeof seedDefaultCategories
>;

const mockRes = () => {
  const res = {} as NextApiResponse;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
};

describe("/api/firebase", () => {
  beforeEach(() => {
    getSessionMock.mockReset();
    createCustomTokenMock.mockReset();
    getAppsMock.mockReset().mockReturnValue([{}]);
    userDocGetMock.mockReset().mockResolvedValue({ exists: true });
    userDocSetMock.mockReset().mockResolvedValue(undefined);
    seedDefaultCategoriesMock.mockReset().mockResolvedValue(0);
    batchCommitMock.mockReset().mockResolvedValue(undefined);
  });

  it("rejects non-GET methods", async () => {
    const res = mockRes();
    await handler({ method: "POST" } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(405);
  });

  it("returns 401 when there is no session user", async () => {
    getSessionMock.mockResolvedValue(null);
    const res = mockRes();
    await handler({ method: "GET" } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("mints a custom token for the session user", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "auth0|123" } });
    createCustomTokenMock.mockResolvedValue("minted-token");
    const res = mockRes();

    await handler({ method: "GET" } as NextApiRequest, res);

    expect(createCustomTokenMock).toHaveBeenCalledWith("auth0|123");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ firebaseToken: "minted-token" });
  });

  it("returns 503 when firebase admin is not configured", async () => {
    getAppsMock.mockReturnValue([]);
    const res = mockRes();
    await handler({ method: "GET" } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(503);
  });

  it("bootstraps a new user with default categories on first login", async () => {
    userDocGetMock.mockResolvedValue({ exists: false });
    getSessionMock.mockResolvedValue({ user: { sub: "auth0|new" } });
    createCustomTokenMock.mockResolvedValue("new-token");
    const res = mockRes();

    await handler({ method: "GET" } as NextApiRequest, res);

    expect(userDocSetMock).toHaveBeenCalledWith(
      expect.objectContaining({ mainCurrency: "USD", onboardingCompleted: false })
    );
    expect(seedDefaultCategoriesMock).toHaveBeenCalledWith("auth0|new");
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("does not re-seed on subsequent logins", async () => {
    userDocGetMock.mockResolvedValue({ exists: true });
    getSessionMock.mockResolvedValue({ user: { sub: "auth0|existing" } });
    createCustomTokenMock.mockResolvedValue("token");
    const res = mockRes();

    await handler({ method: "GET" } as NextApiRequest, res);

    expect(userDocSetMock).not.toHaveBeenCalled();
    expect(seedDefaultCategoriesMock).not.toHaveBeenCalled();
  });
});
