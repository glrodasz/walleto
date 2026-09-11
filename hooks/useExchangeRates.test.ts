import { renderHook, waitFor } from "@testing-library/react";
import { useExchangeRates } from "./useExchangeRates";

const PAYLOAD = {
  base: "USD",
  rates: { USD: 1, EUR: 0.9, MXN: 17, GBP: 0.8, SEK: 10, CHF: 0.95, JPY: 150, COP: 4000 },
  fetchedAt: "2026-06-01T00:00:00.000Z",
  stale: false,
};

const fetchMock = jest.fn();
global.fetch = fetchMock as unknown as typeof fetch;

beforeEach(() => {
  localStorage.clear();
  fetchMock.mockReset();
});

describe("useExchangeRates", () => {
  it("fetches, exposes rates and caches to localStorage", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => PAYLOAD });
    const { result } = renderHook(() => useExchangeRates());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.rates?.rates.COP).toBe(4000);
    expect(result.current.stale).toBe(false);
    expect(localStorage.getItem("sublr.exchangeRates")).toContain("4000");
  });

  it("serves a fresh cache without hitting the network", async () => {
    localStorage.setItem(
      "sublr.exchangeRates",
      JSON.stringify({ fx: PAYLOAD, storedAt: Date.now() })
    );
    const { result } = renderHook(() => useExchangeRates());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.rates?.rates.EUR).toBe(0.9);
  });

  it("serves the expired cache flagged stale when the fetch fails", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    localStorage.setItem(
      "sublr.exchangeRates",
      JSON.stringify({ fx: PAYLOAD, storedAt: Date.now() - 48 * 60 * 60 * 1000 })
    );
    fetchMock.mockRejectedValue(new Error("offline"));
    const { result } = renderHook(() => useExchangeRates());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.rates?.rates.COP).toBe(4000);
    expect(result.current.stale).toBe(true);
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it("returns null rates when nothing was ever cached and the fetch fails", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockRejectedValue(new Error("offline"));
    const { result } = renderHook(() => useExchangeRates());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.rates).toBeNull();
  });

  it("marks rates stale when the server served its fallback snapshot", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ...PAYLOAD, stale: true }) });
    const { result } = renderHook(() => useExchangeRates());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.stale).toBe(true);
  });
});
