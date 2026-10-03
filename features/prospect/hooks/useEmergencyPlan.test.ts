import { act, renderHook } from "@testing-library/react";
import type { EmergencyPlan } from "../../../types";

const updateMock = jest.fn();
let userDocValue: Record<string, unknown> | null = null;

jest.mock("../../../hooks/useUserDoc", () => ({
  useUserDoc: () => ({ userDoc: userDocValue, error: null, update: updateMock }),
}));

import { useEmergencyPlan } from "./useEmergencyPlan";

const saved: EmergencyPlan = {
  currency: "EUR",
  benefitMonthly: 1_000,
  benefitMonths: 6,
  severance: 3_000,
  includeInvestments: true,
};

beforeEach(() => {
  updateMock.mockReset().mockResolvedValue(undefined);
  userDocValue = { mainCurrency: "SEK" };
});

describe("useEmergencyPlan", () => {
  it("starts at zero in the owner's currency", () => {
    const { result } = renderHook(() => useEmergencyPlan());
    expect(result.current.plan).toEqual({
      currency: "SEK",
      benefitMonthly: 0,
      benefitMonths: 0,
      severance: 0,
      includeInvestments: false,
    });
  });

  it("reads the saved plan", () => {
    userDocValue = { mainCurrency: "SEK", emergencyPlan: saved };
    const { result } = renderHook(() => useEmergencyPlan());
    expect(result.current.plan).toEqual(saved);
  });

  it("saves the whole plan and shows it before the echo", async () => {
    userDocValue = { mainCurrency: "SEK", emergencyPlan: saved };
    const { result } = renderHook(() => useEmergencyPlan());

    await act(() => result.current.save({ severance: 0 }));
    expect(updateMock).toHaveBeenCalledWith({ emergencyPlan: { ...saved, severance: 0 } });
    expect(result.current.plan.severance).toBe(0);
  });

  it("surfaces a failed save", async () => {
    updateMock.mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useEmergencyPlan());

    await act(() => result.current.save({ benefitMonths: 3 }));
    expect(result.current.error?.message).toBe("boom");
  });
});
