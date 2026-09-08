import type { NextApiRequest, NextApiResponse } from "next";

const getSessionMock = jest.fn();
const collectionMock = jest.fn();
const addMock = jest.fn();
const docMock = jest.fn();

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

import handler from "../../../pages/api/payment-methods/index";

const mockRes = () => {
  const res = {} as NextApiResponse;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
};

const buildChain = (overrides: { get?: jest.Mock; add?: jest.Mock; doc?: jest.Mock } = {}) => {
  const chain = {
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    get: overrides.get ?? jest.fn().mockResolvedValue({ empty: true, docs: [] }),
    add: overrides.add ?? addMock,
    doc: overrides.doc ?? docMock,
  };
  collectionMock.mockReturnValue(chain);
  return chain;
};

beforeEach(() => {
  getSessionMock.mockReset();
  addMock.mockReset();
  collectionMock.mockReset();
  docMock.mockReset();
});

describe("GET /api/payment-methods", () => {
  it("returns 401 when unauthenticated", async () => {
    getSessionMock.mockResolvedValue(null);
    const res = mockRes();
    await handler({ method: "GET", query: {} } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns the user's payment methods", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
    const doc = { id: "pm1", data: () => ({ name: "Amex", type: "CREDIT_CARD" }) };
    buildChain({ get: jest.fn().mockResolvedValue({ docs: [doc] }) });
    const res = mockRes();
    await handler({ method: "GET", query: {} } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([{ id: "pm1", name: "Amex", type: "CREDIT_CARD" }]);
  });
});

describe("POST /api/payment-methods", () => {
  it("returns 400 for an invalid body", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
    buildChain();
    const res = mockRes();
    await handler(
      { method: "POST", query: {}, body: { name: "Amex", type: "NOPE" } } as NextApiRequest,
      res
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 400 when last4 is not four digits", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
    buildChain();
    const res = mockRes();
    await handler(
      {
        method: "POST",
        query: {},
        body: { name: "Amex", type: "CREDIT_CARD", last4: "12" },
      } as NextApiRequest,
      res
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 409 when a method of the same type already has that name", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
    const chain = buildChain({
      get: jest.fn().mockResolvedValue({
        empty: false,
        docs: [{ id: "existing", data: () => ({ name: "amex", type: "CREDIT_CARD" }) }],
      }),
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({ data: () => ({ mainCurrency: "USD" }) }),
      }),
    });
    const res = mockRes();
    await handler(
      {
        method: "POST",
        query: {},
        body: { name: "Amex", type: "CREDIT_CARD", currencies: ["USD"] },
      } as NextApiRequest,
      res
    );
    expect(chain.where).toHaveBeenCalledWith("type", "==", "CREDIT_CARD");
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: 'You already have a Credit card called "Amex"',
    });
  });

  it("allows the same name for a different type", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
    const add = jest.fn().mockResolvedValue({ id: "pm-transfer" });
    // The type-scoped query finds nothing of type BANK_TRANSFER.
    buildChain({ get: jest.fn().mockResolvedValue({ empty: true, docs: [] }), add });
    const res = mockRes();
    await handler(
      {
        method: "POST",
        query: {},
        body: {
          name: "Bancolombia",
          type: "BANK_TRANSFER",
          currencies: ["COP"],
          network: "Transfer",
        },
      } as NextApiRequest,
      res
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("creates a method and returns 201", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
    const add = jest.fn().mockResolvedValue({ id: "new-pm" });
    buildChain({ get: jest.fn().mockResolvedValue({ empty: true, docs: [] }), add });
    const res = mockRes();
    await handler(
      {
        method: "POST",
        query: {},
        body: {
          name: "Amex Gold",
          type: "CREDIT_CARD",
          currencies: ["USD"],
          last4: "3478",
          network: "American Express",
        },
      } as NextApiRequest,
      res
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: "new-pm" });
    expect(add).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user1", last4: "3478", network: "American Express" })
    );
  });

  it("defaults currencies to the user's mainCurrency when omitted", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
    const add = jest.fn().mockResolvedValue({ id: "new-pm" });
    buildChain({
      get: jest.fn().mockResolvedValue({ empty: true, docs: [] }),
      add,
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({ data: () => ({ mainCurrency: "EUR" }) }),
      }),
    });
    const res = mockRes();
    await handler(
      {
        method: "POST",
        query: {},
        body: { name: "Cash", type: "CASH" },
      } as NextApiRequest,
      res
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(add).toHaveBeenCalledWith(expect.objectContaining({ currencies: ["EUR"] }));
  });

  it("rejects a defaultCurrency outside the currencies list", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
    buildChain();
    const res = mockRes();
    await handler(
      {
        method: "POST",
        query: {},
        body: {
          name: "Wise",
          type: "DIGITAL_WALLET",
          currencies: ["USD"],
          defaultCurrency: "EUR",
        },
      } as NextApiRequest,
      res
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe("unsupported methods", () => {
  it("returns 405", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "user1" } });
    buildChain();
    const res = mockRes();
    await handler({ method: "PUT", query: {} } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(405);
  });
});
