import { render, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

const onSnapshotMock = jest.fn();

jest.mock("../firebase/client", () => ({ db: {} }));
jest.mock("firebase/firestore", () => ({
  doc: (_db: unknown, ...path: string[]) => path.join("/"),
  onSnapshot: (...args: unknown[]) => onSnapshotMock(...args),
}));
jest.mock("@auth0/nextjs-auth0/client", () => ({
  useUser: () => ({ user: { sub: "user1" } }),
}));
jest.mock("./useFirebaseAuth", () => ({
  useFirebaseAuth: () => ({ ready: true, error: null }),
}));

import { UserDocProvider, useUserDoc } from "./useUserDoc";

beforeEach(() => {
  onSnapshotMock.mockReset().mockImplementation((_ref, onNext) => {
    onNext({ exists: () => true, data: () => ({ mainCurrency: "EUR" }) });
    return () => {};
  });
});

function Consumer() {
  const { userDoc } = useUserDoc();
  return <span>{userDoc?.mainCurrency ?? "…"}</span>;
}

describe("useUserDoc", () => {
  it("shares one listener between every consumer under the provider", async () => {
    const { findAllByText } = render(
      <UserDocProvider>
        <Consumer />
        <Consumer />
        <Consumer />
      </UserDocProvider>
    );

    expect(await findAllByText("EUR")).toHaveLength(3);
    expect(onSnapshotMock).toHaveBeenCalledTimes(1);
    expect(onSnapshotMock.mock.calls[0][0]).toBe("users/user1");
  });

  it("subscribes on its own when mounted outside the provider", async () => {
    const { result } = renderHook(() => useUserDoc(), {
      wrapper: ({ children }: { children: ReactNode }) => <>{children}</>,
    });

    await waitFor(() => expect(result.current.userDoc?.mainCurrency).toBe("EUR"));
    expect(onSnapshotMock).toHaveBeenCalledTimes(1);
  });
});
