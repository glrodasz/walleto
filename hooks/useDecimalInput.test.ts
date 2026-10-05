import { renderHook } from "@testing-library/react";
import { useDecimalInput } from "./useDecimalInput";

let decimalSeparator: "." | "," = ".";
jest.mock("./usePreferences", () => ({
  usePreferences: () => ({ decimalSeparator }),
}));

describe("useDecimalInput", () => {
  beforeEach(() => {
    decimalSeparator = ".";
  });

  it("toPrefill leaves a 0 out so the placeholder shows it", () => {
    const { result } = renderHook(() => useDecimalInput());
    expect(result.current.toPrefill(0)).toBe("");
    expect(result.current.toPrefill(NaN)).toBe("");
    expect(result.current.toPrefill(1.5)).toBe("1.5");
    // toInput still writes a 0 — it echoes a value, it doesn't open a field.
    expect(result.current.toInput(0)).toBe("0");
  });

  it("toPrefill writes the owner's separator", () => {
    decimalSeparator = ",";
    const { result } = renderHook(() => useDecimalInput());
    expect(result.current.toPrefill(1.5)).toBe("1,5");
  });
});
