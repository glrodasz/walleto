import { act, renderHook, waitFor } from "@testing-library/react";
import { useAdminUsage } from "./useAdminUsage";

const fetchMock = jest.fn();
beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});

describe("useAdminUsage", () => {
  it("loads the summary", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ totals: { users: 3 } }) });
    const { result } = renderHook(() => useAdminUsage());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchMock).toHaveBeenCalledWith("/api/admin/usage", undefined);
    expect(result.current.usage?.totals.users).toBe(3);
  });

  it("reports a failure as an error, not as empty data", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 });
    const { result } = renderHook(() => useAdminUsage());
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.usage).toBeNull();

    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ totals: { users: 1 } }) });
    await act(() => result.current.reload());
    expect(result.current.error).toBeNull();
    expect(result.current.usage?.totals.users).toBe(1);
  });
});
