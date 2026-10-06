import { renderHook, act } from "@testing-library/react";
import type { UserDoc } from "../../../hooks/useUserDoc";

const updateMock = jest.fn();
let userDoc: Partial<UserDoc> | null;

jest.mock("../../../hooks/useUserDoc", () => ({
  useUserDoc: () => ({ userDoc, update: updateMock }),
}));

import { useCurrenciesStep } from "./useCurrenciesStep";

beforeEach(() => {
  updateMock.mockReset().mockResolvedValue(undefined);
  userDoc = { mainCurrency: "USD" };
});

describe("useCurrenciesStep", () => {
  it("starts from the stored currency and the default list", () => {
    const { result } = renderHook(() => useCurrenciesStep());
    expect(result.current.currency).toBe("USD");
    expect(result.current.enabled).toEqual(["USD", "EUR", "GBP"]);
  });

  it("offers the picked currency right away, locked on", () => {
    const { result } = renderHook(() => useCurrenciesStep());
    act(() => result.current.setCurrency("COP"));
    expect(result.current.enabled).toEqual(["USD", "EUR", "GBP", "COP"]);
    expect(result.current.locked("COP")).toBeTruthy();

    act(() => result.current.toggle("COP"));
    expect(result.current.enabled).toContain("COP");
  });

  it("saves one currency choice and the picked list", async () => {
    const { result } = renderHook(() => useCurrenciesStep());
    act(() => result.current.setCurrency("COP"));
    act(() => result.current.toggle("GBP"));
    await act(async () => {
      await result.current.save();
    });
    expect(updateMock).toHaveBeenCalledWith({
      mainCurrency: "COP",
      displayCurrency: "COP",
      enabledCurrencies: ["USD", "EUR", "COP"],
    });
  });

  it("does not write when nothing changed", async () => {
    const { result } = renderHook(() => useCurrenciesStep());
    await act(async () => {
      await result.current.save();
    });
    expect(updateMock).not.toHaveBeenCalled();
  });
});
