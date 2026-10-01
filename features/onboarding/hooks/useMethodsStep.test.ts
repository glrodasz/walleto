import { renderHook, act, waitFor } from "@testing-library/react";

const createMock = jest.fn();
const removeMock = jest.fn();
const updateMock = jest.fn();
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
    update: updateMock,
    remove: removeMock,
  }),
}));

import { useMethodsStep } from "./useMethodsStep";
import { LAST4_ERROR } from "../../../helpers/paymentMethodOptions";
import { ALIAS_ERROR } from "./useMethodsStep";

beforeEach(() => {
  createMock.mockReset().mockResolvedValue("new-id");
  removeMock.mockReset().mockResolvedValue(undefined);
  updateMock.mockReset().mockResolvedValue(undefined);
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

  describe("editing saved methods", () => {
    const saved = [
      {
        id: "pm-bc",
        name: "Bancolombia Débito",
        type: "DEBIT_CARD",
        network: "Mastercard",
        last4: "8817",
      },
      { id: "pm-wise", name: "Wise", type: "DIGITAL_WALLET", network: "Wise" },
      { id: "pm-cash", name: "Efectivo", type: "CASH" },
    ];

    async function hydrated() {
      methodsValue = saved;
      const hook = renderHook(() => useMethodsStep());
      await waitFor(() => expect(hook.result.current.rows).toHaveLength(3));
      return hook;
    }

    it("patches only the saved rows that changed, with only what changed", async () => {
      const { result } = await hydrated();
      const [card] = result.current.rows;

      act(() => result.current.update(card.key, { name: "Bancolombia " }));
      act(() => result.current.update(card.key, { last4: "1234" }));
      await act(async () => {
        await result.current.save();
      });

      expect(updateMock).toHaveBeenCalledTimes(1);
      // Trimmed, and the untouched network stays out of the body.
      expect(updateMock).toHaveBeenCalledWith("pm-bc", { name: "Bancolombia", last4: "1234" });
      expect(createMock).not.toHaveBeenCalled();
    });

    it("sends nothing when nothing changed", async () => {
      const { result } = await hydrated();

      await act(async () => {
        expect(await result.current.save()).toBe(0);
      });

      expect(updateMock).not.toHaveBeenCalled();
    });

    it("clears the last 4 with a null, which the route turns into a delete", async () => {
      const { result } = await hydrated();

      act(() => result.current.update(result.current.rows[0].key, { last4: "" }));
      await act(async () => {
        await result.current.save();
      });

      expect(updateMock).toHaveBeenCalledWith("pm-bc", { last4: null });
    });

    it("sends a provider change, but never a network for a type that has none", async () => {
      const { result } = await hydrated();
      const [, wise, cash] = result.current.rows;

      act(() => result.current.update(wise.key, { network: "Revolut" }));
      act(() => result.current.update(cash.key, { network: "Ignored", last4: "1111" }));
      await act(async () => {
        await result.current.save();
      });

      expect(updateMock).toHaveBeenCalledTimes(1);
      expect(updateMock).toHaveBeenCalledWith("pm-wise", { network: "Revolut" });
    });

    it("refuses a saved row whose alias was cleared, before sending anything", async () => {
      const { result } = await hydrated();

      act(() => result.current.update(result.current.rows[1].key, { name: "  " }));
      act(() => result.current.add({ type: "CASH", name: "Wallet" }));
      await act(async () => {
        await expect(result.current.save()).rejects.toThrow(ALIAS_ERROR);
      });

      expect(updateMock).not.toHaveBeenCalled();
      expect(createMock).not.toHaveBeenCalled();
      expect(result.current.attempt).toBe(1);
    });

    it("counts only created rows, not patched ones", async () => {
      const { result } = await hydrated();

      act(() => result.current.update(result.current.rows[2].key, { name: "Cash" }));
      act(() => result.current.add({ type: "CASH", name: "Coins" }));
      let created = -1;
      await act(async () => {
        created = await result.current.save();
      });

      expect(created).toBe(1);
      expect(updateMock).toHaveBeenCalledWith("pm-cash", { name: "Cash" });
    });

    it("keeps created rows' ids when a patch fails", async () => {
      const { result } = await hydrated();
      updateMock.mockRejectedValueOnce(new Error("boom"));

      act(() => result.current.update(result.current.rows[2].key, { name: "Cash" }));
      act(() => result.current.add({ type: "CASH", name: "Coins" }));
      await act(async () => {
        await expect(result.current.save()).rejects.toThrow("boom");
      });

      expect(result.current.rows[3].id).toBe("new-id");
    });
  });
});
