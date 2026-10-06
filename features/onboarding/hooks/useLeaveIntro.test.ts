import { renderHook } from "@testing-library/react";
import type { UserDoc } from "../../../hooks/useUserDoc";

const push = jest.fn();
const update = jest.fn();
let userDoc: Partial<UserDoc> | null = null;
let query: Record<string, string> = {};
let isReady = true;

jest.mock("next/router", () => ({ useRouter: () => ({ push, query, isReady }) }));
jest.mock("../../../hooks/useUserDoc", () => ({ useUserDoc: () => ({ userDoc, update }) }));

import { useLeaveIntro } from "./useLeaveIntro";
import { ONBOARDING_TOUR } from "../helpers/routes";

/** The query a client-side push to `href` parses into. */
const queryOf = (href: string) =>
  Object.fromEntries(new URL(href, "http://localhost").searchParams.entries());

beforeEach(() => {
  push.mockReset();
  update.mockReset().mockResolvedValue(undefined);
  userDoc = { onboardingCompleted: false };
  query = {};
  isReady = true;
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
    query = queryOf(ONBOARDING_TOUR);
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

  it("reads the replay from the URL, even before the doc loads", () => {
    userDoc = null;
    query = queryOf(ONBOARDING_TOUR);
    const { result } = renderHook(() => useLeaveIntro());
    expect(result.current.replay).toBe(true);
  });

  it("is a first run without the tour flag, even for someone onboarded", () => {
    userDoc = { onboardingCompleted: true, onboardingIntroSeen: true };
    const { result } = renderHook(() => useLeaveIntro());
    expect(result.current.replay).toBe(false);
    result.current.leave();
    expect(push).toHaveBeenCalledWith("/onboarding/categories");
  });

  it("is not ready until the router has parsed the query", () => {
    isReady = false;
    const { result } = renderHook(() => useLeaveIntro());
    expect(result.current.ready).toBe(false);
  });
});
