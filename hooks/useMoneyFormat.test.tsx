import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { useMoneyFormat } from "./useMoneyFormat";
import { PrivacyProvider, PRIVACY_STORAGE_KEY } from "./usePrivacy";

const wrapper = ({ children }: { children: ReactNode }) => (
  <PrivacyProvider>{children}</PrivacyProvider>
);

describe("useMoneyFormat", () => {
  afterEach(() => localStorage.clear());

  it("writes amounts out by default", () => {
    const { result } = renderHook(() => useMoneyFormat(), { wrapper });
    expect(result.current.hidden).toBe(false);
    expect(result.current.formatAmount(1150, "USD")).toBe("$1,150.00");
    expect(result.current.formatNative(1150, "USD", "USD")).toBe("$1,150.00");
    expect(result.current.formatCompact(60_000, "USD")).toBe("$60K");
    expect(result.current.formatTick(60_000, "USD")).toBe("$60K");
  });

  it("masks every formatter once privacy mode is on", () => {
    localStorage.setItem(PRIVACY_STORAGE_KEY, "true");
    const { result } = renderHook(() => useMoneyFormat(), { wrapper });
    expect(result.current.hidden).toBe(true);
    expect(result.current.formatAmount(1150, "USD")).toBe("$****");
    expect(result.current.formatNative(1150, "USD", "USD")).toBe("$****");
    expect(result.current.formatCompact(60_000, "USD")).toBe("$****");
  });

  it("blanks axis ticks rather than stacking identical masks", () => {
    localStorage.setItem(PRIVACY_STORAGE_KEY, "true");
    const { result } = renderHook(() => useMoneyFormat(), { wrapper });
    expect(result.current.formatTick(60_000, "USD")).toBe("");
  });

  it("works without a provider — nothing is masked", () => {
    const { result } = renderHook(() => useMoneyFormat());
    expect(result.current.hidden).toBe(false);
    expect(result.current.formatAmount(1150, "USD")).toBe("$1,150.00");
  });
});
