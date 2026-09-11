import { request } from "./request";

describe("request", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("resolves the parsed JSON body on a successful response", async () => {
    const json = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json }) as unknown as typeof fetch;

    await expect(request<{ ok: boolean }>("https://example.test")).resolves.toEqual({
      ok: true,
    });
  });

  it("throws with the status code when the response is not ok", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: false, status: 503, json: jest.fn() }) as unknown as typeof fetch;

    await expect(request("https://example.test")).rejects.toThrow(
      "Request to https://example.test failed with status 503"
    );
  });

  it("forwards request options to fetch", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue({}) });
    global.fetch = fetchMock as unknown as typeof fetch;

    await request("https://example.test", { headers: { apikey: "k" } });

    expect(fetchMock).toHaveBeenCalledWith("https://example.test", {
      headers: { apikey: "k" },
    });
  });
});
