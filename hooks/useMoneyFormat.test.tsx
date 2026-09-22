import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { useMoneyFormat } from "./useMoneyFormat";
import { PrivacyProvider, PRIVACY_STORAGE_KEY } from "./usePrivacy";
import { DEFAULT_PREFERENCES, PreferencesContext } from "./usePreferences";

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

describe("useMoneyFormat with number preferences", () => {
  const comma = ({ children }: { children: ReactNode }) => (
    <PreferencesContext.Provider
      value={{ ...DEFAULT_PREFERENCES, decimalSeparator: ",", decimals: 3 }}
    >
      {children}
    </PreferencesContext.Provider>
  );

  it("writes every formatter with the user's separator and decimals", () => {
    const { result } = renderHook(() => useMoneyFormat(), { wrapper: comma });
    expect(result.current.separator).toBe(",");
    expect(result.current.formatAmount(1150.5, "USD")).toBe("$1.150,500");
    expect(result.current.formatNative(1150, "EUR", "USD").replace(/\u00a0/g, " ")).toBe(
      "EUR 1.150,000"
    );
    expect(result.current.formatCompact(60_500, "USD")).toBe("$60,5K");
    expect(result.current.formatTick(60_500, "USD")).toBe("$60,5K");
    expect(result.current.formatPercent(16.66)).toBe("16,7%");
    expect(result.current.formatNumber(19.9)).toBe("19,9");
  });
});
