import { renderHook, waitFor } from "@testing-library/react";

const authMock: {
  currentUser: { uid: string } | null;
  authStateReady: jest.Mock;
} = { currentUser: null, authStateReady: jest.fn() };
const signInMock = jest.fn();
const signOutMock = jest.fn();
let sub: string | undefined = "auth0|me";

jest.mock("../firebase/client", () => ({
  get auth() {
    return authMock;
  },
}));
jest.mock("firebase/auth", () => ({
  signInWithCustomToken: (...args: unknown[]) => signInMock(...args),
  signOut: (...args: unknown[]) => signOutMock(...args),
}));
jest.mock("@auth0/nextjs-auth0/client", () => ({
  useUser: () => ({ user: sub ? { sub } : undefined }),
}));

const fetchMock = jest.fn();
global.fetch = fetchMock as unknown as typeof fetch;

import { useFirebaseAuth } from "./useFirebaseAuth";

beforeEach(() => {
  sub = "auth0|me";
  authMock.currentUser = null;
  authMock.authStateReady.mockReset().mockResolvedValue(undefined);
  signInMock.mockReset().mockImplementation(async () => {
    authMock.currentUser = { uid: sub! };
  });
  signOutMock.mockReset().mockImplementation(async () => {
    authMock.currentUser = null;
  });
  fetchMock.mockReset().mockResolvedValue({
    ok: true,
    json: async () => ({ firebaseToken: "token" }),
  });
});

describe("useFirebaseAuth", () => {
  it("reuses the session Firebase restored from IndexedDB without minting a token", async () => {
    authMock.authStateReady.mockImplementation(async () => {
      authMock.currentUser = { uid: "auth0|me" };
    });
    const { result } = renderHook(() => useFirebaseAuth());

    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(signInMock).not.toHaveBeenCalled();
  });

  it("mints a token when nothing was restored, once for every instance", async () => {
    const a = renderHook(() => useFirebaseAuth());
    const b = renderHook(() => useFirebaseAuth());

    await waitFor(() => expect(a.result.current.ready).toBe(true));
    await waitFor(() => expect(b.result.current.ready).toBe(true));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(signInMock).toHaveBeenCalledWith(authMock, "token");
  });

  it("signs out a restored session that belongs to another user", async () => {
    authMock.authStateReady.mockImplementation(async () => {
      authMock.currentUser = { uid: "auth0|someone-else" };
    });
    const { result } = renderHook(() => useFirebaseAuth());

    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(signOutMock).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(authMock.currentUser).toEqual({ uid: "auth0|me" });
  });

  it("waits for the Auth0 user before signing in", async () => {
    sub = undefined;
    const { result } = renderHook(() => useFirebaseAuth());

    await new Promise((r) => setTimeout(r, 0));
    expect(result.current.ready).toBe(false);
    expect(authMock.authStateReady).not.toHaveBeenCalled();
  });

  it("surfaces a failed token fetch", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 503 });
    const { result } = renderHook(() => useFirebaseAuth());

    await waitFor(() => expect(result.current.error?.message).toContain("503"));
    expect(result.current.ready).toBe(false);
  });
});
