import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { THEME_STORAGE_KEY, ThemeProvider, resolveTheme, useTheme } from "./useTheme";

const update = jest.fn(async () => {});
let userDoc: { theme?: string } | null = null;

jest.mock("next/head", () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
jest.mock("./useUserDoc", () => ({
  useUserDoc: () => ({ userDoc, update }),
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

function mockMatchMedia(dark: boolean) {
  const listeners: Array<() => void> = [];
  const mq = {
    matches: dark,
    addEventListener: (_: string, fn: () => void) => listeners.push(fn),
    removeEventListener: (_: string, fn: () => void) => {
      const i = listeners.indexOf(fn);
      if (i >= 0) listeners.splice(i, 1);
    },
  };
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: jest.fn(() => mq),
  });
  return {
    flip: (next: boolean) => {
      mq.matches = next;
      listeners.forEach((fn) => fn());
    },
  };
}

describe("useTheme", () => {
  beforeEach(() => {
    localStorage.clear();
    update.mockClear();
    userDoc = null;
    delete document.documentElement.dataset.theme;
    mockMatchMedia(false);
  });

  it("hydrates from localStorage and stamps <html>", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.preference).toBe("dark");
    expect(result.current.resolved).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("saves a new preference locally and on the user doc", async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(() => result.current.setPreference("dark"));
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(update).toHaveBeenCalledWith({ theme: "dark" });
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("follows the OS while on system", () => {
    const media = mockMatchMedia(false);
    localStorage.setItem(THEME_STORAGE_KEY, "system");
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.resolved).toBe("light");
    act(() => media.flip(true));
    expect(result.current.resolved).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("lets the saved preference from the user doc win over the local cache", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "light");
    userDoc = { theme: "dark" };
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.preference).toBe("dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  });

  it("resolves system against the media query", () => {
    mockMatchMedia(true);
    expect(resolveTheme("system")).toBe("dark");
    expect(resolveTheme("light")).toBe("light");
  });
});
