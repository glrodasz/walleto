import { renderHook, act, waitFor } from "@testing-library/react";

const createMock = jest.fn();
const removeMock = jest.fn();
let methodsValue: {
  id?: string;
  name: string;
  type: string;
  last4?: string;
  network?: string;
}[] = [];
let loadingValue = false;

jest.mock("../../../hooks/usePaymentMethods", () => ({
  usePaymentMethods: () => ({
    methods: methodsValue,
    loading: loadingValue,
    create: createMock,
    remove: removeMock,
  }),
}));

import { useMethodsStep } from "./useMethodsStep";
import { LAST4_ERROR } from "../../../helpers/paymentMethodOptions";

beforeEach(() => {
  createMock.mockReset().mockResolvedValue("new-id");
  removeMock.mockReset().mockResolvedValue(undefined);
  methodsValue = [];
  loadingValue = false;
});

describe("useMethodsStep", () => {
  it("saves the type chosen on the row, not an inferred one", async () => {
    const { result } = renderHook(() => useMethodsStep());

    act(() =>
      result.current.update(result.current.rows[0].key, {
        type: "CREDIT_CARD",
        name: "Amex Gold",
      })
    );
    await act(async () => {
      await result.current.save();
    });

    expect(createMock).toHaveBeenCalledWith(expect.objectContaining({ type: "CREDIT_CARD" }));
  });

  it("only sends last4 for card types", async () => {
    const { result } = renderHook(() => useMethodsStep());

    act(() =>
      result.current.update(result.current.rows[0].key, {
        type: "CASH",
        name: "Cash",
        last4: "1234",
      })
    );
    await act(async () => {
      await result.current.save();
    });

    expect(createMock).toHaveBeenCalledWith(expect.not.objectContaining({ last4: "1234" }));
    expect(createMock).toHaveBeenCalledWith(expect.objectContaining({ type: "CASH" }));
  });

  it("keeps last4 for a debit card", async () => {
    const { result } = renderHook(() => useMethodsStep());

    act(() =>
      result.current.update(result.current.rows[0].key, {
        type: "DEBIT_CARD",
        name: "Bancolombia",
        last4: "3478",
      })
    );
    await act(async () => {
      await result.current.save();
    });

    expect(createMock).toHaveBeenCalledWith(expect.objectContaining({ last4: "3478" }));
  });

  it("sends a credit card exactly like a debit card", async () => {
    const { result } = renderHook(() => useMethodsStep());

    act(() => {
      result.current.update(result.current.rows[0].key, {
        type: "DEBIT_CARD",
        name: "Bancolombia",
        network: "Visa",
        last4: "3478",
      });
      result.current.add();
    });
    act(() =>
      result.current.update(result.current.rows[1].key, {
        type: "CREDIT_CARD",
        name: "Bancolombia",
        network: "Visa",
        last4: "9012",
      })
    );
    await act(async () => {
      expect(await result.current.save()).toBe(2);
    });

    expect(createMock).toHaveBeenNthCalledWith(1, {
      name: "Bancolombia",
      type: "DEBIT_CARD",
      network: "Visa",
      last4: "3478",
    });
    expect(createMock).toHaveBeenNthCalledWith(2, {
      name: "Bancolombia",
      type: "CREDIT_CARD",
      network: "Visa",
      last4: "9012",
    });
  });

  it("saves a card without last4", async () => {
    const { result } = renderHook(() => useMethodsStep());

    act(() =>
      result.current.update(result.current.rows[0].key, { type: "CREDIT_CARD", name: "Amex" })
    );
    await act(async () => {
      await result.current.save();
    });

    expect(createMock).toHaveBeenCalledWith({ name: "Amex", type: "CREDIT_CARD" });
  });

  it("refuses a partial last4 before sending any row", async () => {
    const { result } = renderHook(() => useMethodsStep());

    act(() => {
      result.current.update(result.current.rows[0].key, {
        type: "DEBIT_CARD",
        name: "Debit",
        last4: "3478",
      });
      result.current.add();
    });
    act(() =>
      result.current.update(result.current.rows[1].key, {
        type: "CREDIT_CARD",
        name: "Credit",
        last4: "12",
      })
    );

    await act(async () => {
      await expect(result.current.save()).rejects.toThrow(LAST4_ERROR);
    });

    // Nothing half-saved: the valid debit row isn't sent either.
    expect(createMock).not.toHaveBeenCalled();
    expect(result.current.attempted).toBe(true);
  });

  it("only sends network when it is not empty", async () => {
    const { result } = renderHook(() => useMethodsStep());

    act(() =>
      result.current.update(result.current.rows[0].key, {
        type: "CREDIT_CARD",
        name: "Amex Gold",
        network: "American Express",
      })
    );
    await act(async () => {
      await result.current.save();
    });

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({ network: "American Express" })
    );
  });

  it("omits network when it was left blank", async () => {
    const { result } = renderHook(() => useMethodsStep());

    act(() => result.current.update(result.current.rows[0].key, { type: "CASH", name: "Cash" }));
    await act(async () => {
      await result.current.save();
    });

    expect(createMock).toHaveBeenCalledWith(
      expect.not.objectContaining({ network: expect.anything() })
    );
  });

  it("skips rows with no type picked", async () => {
    const { result } = renderHook(() => useMethodsStep());
    act(() => result.current.update(result.current.rows[0].key, { name: "Cash" }));
    await act(async () => {
      expect(await result.current.save()).toBe(0);
    });
    expect(createMock).not.toHaveBeenCalled();
  });

  it("skips rows with no name", async () => {
    const { result } = renderHook(() => useMethodsStep());
    act(() => result.current.update(result.current.rows[0].key, { type: "CASH" }));
    await act(async () => {
      expect(await result.current.save()).toBe(0);
    });
    expect(createMock).not.toHaveBeenCalled();
  });

  it("does not re-create rows that were already saved", async () => {
    const { result } = renderHook(() => useMethodsStep());

    act(() =>
      result.current.update(result.current.rows[0].key, { type: "CREDIT_CARD", name: "Visa card" })
    );
    await act(async () => {
      await result.current.save();
    });
    expect(createMock).toHaveBeenCalledTimes(1);

    // Second save — the row now carries an id, so it must be skipped.
    await act(async () => {
      expect(await result.current.save()).toBe(0);
    });
    expect(createMock).toHaveBeenCalledTimes(1);
  });

  it("deletes a saved row from Firestore, not just from local state", async () => {
    const { result } = renderHook(() => useMethodsStep());

    act(() => result.current.update(result.current.rows[0].key, { type: "CASH", name: "Cash" }));
    await act(async () => {
      await result.current.save();
    });
    const savedKey = result.current.rows[0].key;
    expect(result.current.rows[0].id).toBe("new-id");

    act(() => result.current.removeAt(savedKey));

    // Without the API call the row would come back on the next visit.
    expect(removeMock).toHaveBeenCalledWith("new-id");
    expect(result.current.rows.some((r) => r.key === savedKey)).toBe(false);
  });

  it("does not hit the API when removing a row that was never saved", async () => {
    const { result } = renderHook(() => useMethodsStep());

    act(() => result.current.add());
    const unsavedKey = result.current.rows[1].key;

    act(() => result.current.removeAt(unsavedKey));

    expect(removeMock).not.toHaveBeenCalled();
    expect(result.current.rows.some((r) => r.key === unsavedKey)).toBe(false);
  });

  it("hydrates from already-saved payment methods, including type and network", async () => {
    loadingValue = true;
    const { result, rerender } = renderHook(() => useMethodsStep());
    expect(result.current.rows).toHaveLength(1);

    methodsValue = [{ id: "pm1", name: "Wise", type: "DIGITAL_WALLET", network: "Wise" }];
    loadingValue = false;
    rerender();

    await waitFor(() => expect(result.current.rows[0].name).toBe("Wise"));
    expect(result.current.rows[0].id).toBe("pm1");
    expect(result.current.rows[0].type).toBe("DIGITAL_WALLET");
    expect(result.current.rows[0].network).toBe("Wise");
  });
});
