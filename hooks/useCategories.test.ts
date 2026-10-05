import { act, renderHook } from "@testing-library/react";
import type { Domain } from "../types";

type OnNext = (snap: { docs: { id: string; data: () => unknown }[] }) => void;
const listeners: OnNext[] = [];

jest.mock("../firebase/client", () => ({ db: {} }));
jest.mock("firebase/firestore", () => ({
  collection: () => "categories",
  where: () => null,
  query: () => null,
  onSnapshot: (_q: unknown, onNext: OnNext) => {
    listeners.push(onNext);
    return () => {};
  },
}));
jest.mock("@auth0/nextjs-auth0/client", () => ({
  useUser: () => ({ user: { sub: "user1" } }),
}));
jest.mock("./useFirebaseAuth", () => ({
  useFirebaseAuth: () => ({ ready: true, error: null }),
}));

import { useCategories } from "./useCategories";

const snap = (...docs: { id: string; domain: Domain; name: string }[]) => ({
  docs: docs.map(({ id, ...data }) => ({ id, data: () => ({ ...data, createdAt: null }) })),
});

beforeEach(() => {
  listeners.length = 0;
});

describe("useCategories", () => {
  it("drops the previous domain's categories the moment the domain changes", () => {
    const { result, rerender } = renderHook(({ domain }) => useCategories(domain), {
      initialProps: { domain: "EXPENSE" as Domain },
    });
    act(() => listeners[0](snap({ id: "c1", domain: "EXPENSE", name: "Mortgage" })));
    expect(result.current.categories.map((c) => c.id)).toEqual(["c1"]);

    rerender({ domain: "DEBT" });
    expect(result.current.categories).toEqual([]);

    act(() => listeners[1](snap({ id: "d1", domain: "DEBT", name: "Mortgage" })));
    expect(result.current.categories.map((c) => c.id)).toEqual(["d1"]);
  });
});
