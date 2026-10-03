import { renderHook } from "@testing-library/react";
import type { UserDoc } from "../../../hooks/useUserDoc";

const push = jest.fn();
const update = jest.fn();
let userDoc: Partial<UserDoc> | null = null;

jest.mock("next/router", () => ({ useRouter: () => ({ push }) }));
jest.mock("../../../hooks/useUserDoc", () => ({ useUserDoc: () => ({ userDoc, update }) }));

import { useLeaveIntro } from "./useLeaveIntro";

beforeEach(() => {
  push.mockReset();
  update.mockReset().mockResolvedValue(undefined);
  userDoc = { onboardingCompleted: false };
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe("useLeaveIntro", () => {
  it("remembers the intro was seen and starts the wizard", () => {
    const { result } = renderHook(() => useLeaveIntro());
    expect(result.current.replay).toBe(false);
    result.current.leave();
    expect(update).toHaveBeenCalledWith({ onboardingIntroSeen: true });
    expect(push).toHaveBeenCalledWith("/onboarding/categories");
  });

  it("does not write the flag again once it is set", () => {
    userDoc = { onboardingCompleted: false, onboardingIntroSeen: true };
    const { result } = renderHook(() => useLeaveIntro());
    result.current.leave();
    expect(update).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/onboarding/categories");
  });

  it("goes back to Settings on a replay, without writing anything", () => {
    userDoc = { onboardingCompleted: true, onboardingIntroSeen: true };
    const { result } = renderHook(() => useLeaveIntro());
    expect(result.current.replay).toBe(true);
    result.current.leave();
    expect(update).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/settings");
  });

  it("still starts the wizard when remembering the intro fails", async () => {
    update.mockRejectedValue(new Error("offline"));
    const { result } = renderHook(() => useLeaveIntro());
    result.current.leave();
    expect(push).toHaveBeenCalledWith("/onboarding/categories");
    // The rejection is swallowed (logged), never thrown at the caller.
    await Promise.resolve();
    expect(console.error).toHaveBeenCalled();
  });

  it("treats a doc that hasn't loaded yet as a first run", () => {
    userDoc = null;
    const { result } = renderHook(() => useLeaveIntro());
    expect(result.current.replay).toBe(false);
  });
});
