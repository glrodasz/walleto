import { act, renderHook } from "@testing-library/react";

const push = jest.fn();
const update = jest.fn();
const materializeNow = jest.fn();

jest.mock("next/router", () => ({ useRouter: () => ({ push }) }));
jest.mock("../../../hooks/useUserDoc", () => ({ useUserDoc: () => ({ update }) }));
jest.mock("../../../hooks/useMaterialize", () => ({ materializeNow: () => materializeNow() }));

import { useLeaveOnboarding } from "./useLeaveOnboarding";

beforeEach(() => {
  push.mockReset();
  update.mockReset().mockResolvedValue(undefined);
  materializeNow.mockReset().mockResolvedValue(undefined);
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe("useLeaveOnboarding", () => {
  it("completes onboarding and goes to the dashboard", async () => {
    const { result } = renderHook(() => useLeaveOnboarding());
    await act(() => result.current.leave());
    expect(update).toHaveBeenCalledWith({ onboardingCompleted: true });
    expect(materializeNow).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/");
    expect(result.current.error).toBeNull();
  });

  it("saves the current step before leaving", async () => {
    const flush = jest.fn().mockResolvedValue(true);
    const { result } = renderHook(() => useLeaveOnboarding(flush));
    await act(() => result.current.leave());
    expect(flush).toHaveBeenCalled();
    expect(flush.mock.invocationCallOrder[0]).toBeLessThan(update.mock.invocationCallOrder[0]);
    expect(push).toHaveBeenCalledWith("/");
  });

  it("stays on the step when saving it fails", async () => {
    const flush = jest.fn().mockResolvedValue(false);
    const { result } = renderHook(() => useLeaveOnboarding(flush));
    await act(() => result.current.leave());
    expect(update).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("stays and reports when completing onboarding fails", async () => {
    update.mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useLeaveOnboarding());
    await act(() => result.current.leave());
    expect(push).not.toHaveBeenCalled();
    expect(result.current.leaving).toBe(false);
    expect(result.current.error).toBe("Could not save your progress. Please try again.");
  });

  it("still leaves when writing history fails", async () => {
    materializeNow.mockRejectedValue(new Error("later"));
    const { result } = renderHook(() => useLeaveOnboarding());
    await act(() => result.current.leave());
    expect(push).toHaveBeenCalledWith("/");
  });
});
