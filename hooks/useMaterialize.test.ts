import { renderHook } from "@testing-library/react";
import { useMaterialize } from "./useMaterialize";

jest.mock("@auth0/nextjs-auth0/client", () => ({
  useUser: () => ({ user: { sub: "user1" } }),
}));

const fetchMock = jest.fn().mockResolvedValue({ ok: true });
global.fetch = fetchMock as unknown as typeof fetch;

beforeEach(() => {
  sessionStorage.clear();
  fetchMock.mockClear();
});

describe("useMaterialize", () => {
  it("fires the materialize request once per session", () => {
    renderHook(() => useMaterialize());
    renderHook(() => useMaterialize());

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/api/transactions/materialize", { method: "POST" });
  });

  it("releases the guard when the request fails so a reload can retry", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockRejectedValueOnce(new Error("offline"));

    renderHook(() => useMaterialize());
    // Let the rejection handler run.
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(sessionStorage.getItem("sublr.materialized")).toBeNull();
  });
});
