import type { NextApiRequest, NextApiResponse } from "next";

const getSessionMock = jest.fn();
const requestMock = jest.fn();
const ratesDocSetMock = jest.fn();
const ratesGetMock = jest.fn();

jest.mock("../../lib/auth0", () => ({
  __esModule: true,
  default: {
    withApiAuthRequired: (fn: unknown) => fn,
    getSession: (...args: unknown[]) => getSessionMock(...args),
  },
}));
jest.mock("../../utils/request", () => ({
  request: (...args: unknown[]) => requestMock(...args),
}));
jest.mock("../../firebase/admin", () => ({
  __esModule: true,
  default: {
    firestore: Object.assign(
      jest.fn(() => ({
        collection: jest.fn(() => ({
          doc: jest.fn(() => ({ set: ratesDocSetMock })),
          orderBy: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          get: ratesGetMock,
        })),
      })),
      { FieldPath: { documentId: jest.fn(() => "__name__") } }
    ),
  },
}));

import handler, { _resetRatesCacheForTests } from "../../pages/api/currencies";

const mockRes = () => {
  const res = {} as NextApiResponse;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
};

const UPSTREAM_RATES = {
  rates: { EUR: 0.9, MXN: 17, GBP: 0.8, SEK: 10, CHF: 0.95, JPY: 150, COP: 4000 },
};

const originalKey = process.env.EXCHANGE_RATES_API_KEY;

beforeEach(() => {
  _resetRatesCacheForTests();
  getSessionMock.mockReset().mockResolvedValue({ user: { sub: "user1" } });
  requestMock.mockReset();
  ratesDocSetMock.mockReset().mockResolvedValue(undefined);
  ratesGetMock.mockReset().mockResolvedValue({ empty: true, docs: [] });
  process.env.EXCHANGE_RATES_API_KEY = "secret";
});

afterAll(() => {
  process.env.EXCHANGE_RATES_API_KEY = originalKey;
});

describe("GET /api/currencies", () => {
  it("returns 401 when unauthenticated", async () => {
    getSessionMock.mockResolvedValue(null);
    const res = mockRes();
    await handler({ method: "GET" } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 405 for non-GET methods", async () => {
    const res = mockRes();
    await handler({ method: "POST" } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.setHeader).toHaveBeenCalledWith("Allow", "GET");
  });

  it("serves all 8 currencies with USD pinned to 1 and mirrors the snapshot", async () => {
    requestMock.mockResolvedValue(UPSTREAM_RATES);
    const res = mockRes();
    await handler({ method: "GET" } as NextApiRequest, res);

    expect(requestMock).toHaveBeenCalledWith(
      expect.stringContaining("symbols=EUR,MXN,GBP,SEK,CHF,JPY,COP"),
      { headers: { apikey: "secret" } }
    );
    expect(res.status).toHaveBeenCalledWith(200);
    const payload = (res.json as jest.Mock).mock.calls[0][0];
    expect(payload.base).toBe("USD");
    expect(payload.rates.USD).toBe(1);
    expect(payload.rates.COP).toBe(4000);
    expect(payload.stale).toBe(false);
    expect(ratesDocSetMock).toHaveBeenCalled();
  });

  it("serves the in-memory cache on the second call without refetching", async () => {
    requestMock.mockResolvedValue(UPSTREAM_RATES);
    await handler({ method: "GET" } as NextApiRequest, mockRes());
    const res = mockRes();
    await handler({ method: "GET" } as NextApiRequest, res);

    expect(requestMock).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("rejects an upstream payload that fails validation and falls back", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    requestMock.mockResolvedValue({ rates: { EUR: -1 } });
    const res = mockRes();
    await handler({ method: "GET" } as NextApiRequest, res);
    // No cache, no mirror -> 503, never a half-validated payload.
    expect(res.status).toHaveBeenCalledWith(503);
  });

  it("falls back to the mirrored snapshot marked stale when upstream fails", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    requestMock.mockRejectedValue(new Error("upstream down"));
    const mirrored = {
      base: "USD",
      rates: { USD: 1, EUR: 0.9, MXN: 17, GBP: 0.8, SEK: 10, CHF: 0.95, JPY: 150, COP: 4000 },
      fetchedAt: "2026-06-01T00:00:00.000Z",
    };
    ratesGetMock.mockResolvedValue({ empty: false, docs: [{ data: () => mirrored }] });

    const res = mockRes();
    await handler({ method: "GET" } as NextApiRequest, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const payload = (res.json as jest.Mock).mock.calls[0][0];
    expect(payload.stale).toBe(true);
    expect(payload.rates.COP).toBe(4000);
  });

  it("returns 503 when there is no upstream, no cache and no mirror", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    delete process.env.EXCHANGE_RATES_API_KEY;
    const res = mockRes();
    await handler({ method: "GET" } as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(503);
  });
});
