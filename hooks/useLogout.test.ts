import { renderHook } from "@testing-library/react";
import type { MouseEvent } from "react";

const calls: string[] = [];
const signOutMock = jest.fn(async () => {
  calls.push("signOut");
});
const terminateMock = jest.fn(async () => {
  calls.push("terminate");
});
const clearMock = jest.fn(async () => {
  calls.push("clear");
});
const assignMock = jest.fn((href: string) => {
  calls.push(`assign ${href}`);
});

jest.mock("../firebase/client", () => ({ auth: "AUTH", db: "DB" }));
jest.mock("firebase/auth", () => ({ signOut: (...a: []) => signOutMock(...a) }));
jest.mock("firebase/firestore", () => ({
  terminate: (...a: []) => terminateMock(...a),
  clearIndexedDbPersistence: (...a: []) => clearMock(...a),
}));

import { useLogout } from "./useLogout";

const click = () =>
  ({ preventDefault: jest.fn() }) as unknown as MouseEvent<HTMLAnchorElement> & {
    preventDefault: jest.Mock;
  };

beforeAll(() => {
  Object.defineProperty(window, "location", {
    value: { assign: assignMock },
    writable: true,
  });
});

beforeEach(() => {
  calls.length = 0;
  jest.clearAllMocks();
});

describe("useLogout", () => {
  it("wipes the local Firebase session and cache before handing off to Auth0", async () => {
    const { result } = renderHook(() => useLogout());
    const event = click();
    await result.current(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(calls).toEqual(["signOut", "terminate", "clear", "assign /api/auth/logout"]);
  });

  it("still logs out when clearing fails (e.g. another tab holds the cache)", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    clearMock.mockRejectedValueOnce(new Error("failed-precondition"));
    const { result } = renderHook(() => useLogout());
    await result.current(click());

    expect(assignMock).toHaveBeenCalledWith("/api/auth/logout");
    spy.mockRestore();
  });
});
