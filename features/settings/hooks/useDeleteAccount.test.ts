import { act, renderHook } from "@testing-library/react";
import { useDeleteAccount } from "./useDeleteAccount";

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  (console.error as jest.Mock).mockRestore();
});

describe("useDeleteAccount", () => {
  it("calls DELETE /api/account and then logs out", async () => {
    fetchMock.mockResolvedValue({ ok: true });
    const navigate = jest.fn();
    const { result } = renderHook(() => useDeleteAccount(navigate));

    await act(() => result.current.deleteAccount());

    expect(fetchMock).toHaveBeenCalledWith("/api/account", { method: "DELETE" });
    expect(navigate).toHaveBeenCalledWith("/api/auth/logout");
    expect(result.current.error).toBeNull();
  });

  it("surfaces a failure and stays signed in", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 });
    const navigate = jest.fn();
    const { result } = renderHook(() => useDeleteAccount(navigate));

    await act(() => result.current.deleteAccount());

    expect(navigate).not.toHaveBeenCalled();
    expect(result.current.deleting).toBe(false);
    expect(result.current.error).toMatch(/Couldn't delete/);
  });
});
