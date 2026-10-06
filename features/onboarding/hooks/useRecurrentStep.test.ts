import { renderHook, act, waitFor } from "@testing-library/react";

const createMock = jest.fn();
const updateMock = jest.fn();
const removeMock = jest.fn();
let itemsValue: {
  id?: string;
  categoryId: string;
  name: string;
  amount: number;
  currency: string;
  frequency: string;
  paymentMethodId?: string;
  startDate: { toDate: () => Date };
}[] = [];
let loadingValue = false;

jest.mock("../../../hooks/useRecurrentTransactions", () => ({
  useRecurrentTransactions: () => ({
    items: itemsValue,
    loading: loadingValue,
    create: createMock,
    update: updateMock,
    remove: removeMock,
  }),
}));

const updateTransactionMock = jest.fn().mockResolvedValue(undefined);
const createTransactionMock = jest.fn().mockResolvedValue("tx1");
jest.mock("../../../hooks/useTransactions", () => ({
  createTransaction: (...args: unknown[]) => createTransactionMock(...args),
  deleteTransaction: jest.fn().mockResolvedValue(undefined),
  updateTransaction: (...args: unknown[]) => updateTransactionMock(...args),
}));

jest.mock("../../../hooks/useCategories", () => ({
  useCategories: () => ({
    categories: [
      { id: "cat1", name: "Salary", domain: "INCOME" },
      { id: "cat-subs", name: "Subscriptions", domain: "EXPENSE" },
    ],
    loading: false,
    error: null,
    create: jest.fn(),
    remove: jest.fn(),
  }),
}));

jest.mock("../../../hooks/usePaymentMethods", () => ({
  usePaymentMethods: () => ({
    methods: [{ id: "pm1", name: "Cash", type: "CASH" }],
    loading: false,
    create: jest.fn(),
    remove: jest.fn(),
  }),
}));

import { SAVED_ROW_ERROR, useRecurrentStep } from "./useRecurrentStep";

const fillValidRow = (
  result: { current: ReturnType<typeof useRecurrentStep> },
  extra: Record<string, unknown> = {}
) =>
  act(() =>
    result.current.update(result.current.rows[0].key, {
      categoryId: "cat1",
      name: "Monthly salary",
      amount: "5000",
      ...extra,
    })
  );

const ts = (date: Date) => ({ toDate: () => date });

beforeEach(() => {
  createMock.mockReset().mockResolvedValue("new-rt");
  updateMock.mockReset().mockResolvedValue(undefined);
  updateTransactionMock.mockClear();
  createTransactionMock.mockClear();
  removeMock.mockReset().mockResolvedValue(undefined);
  itemsValue = [];
  loadingValue = false;
});

describe("useRecurrentStep", () => {
  it("creates a row with the domain's default type, its own currency and a startDate", async () => {
    const { result } = renderHook(() => useRecurrentStep("INCOME", "USD"));

    fillValidRow(result);
    await act(async () => {
      expect(await result.current.save()).toBe(1);
    });

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        domain: "INCOME",
        categoryId: "cat1",
        name: "Monthly salary",
        amount: 5000,
        currency: "USD",
        frequency: "MONTHLY",
        type: "SALARY",
        startDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      })
    );
  });

  it("new rows start in the step's default currency but can be switched per row", async () => {
    const { result } = renderHook(() => useRecurrentStep("INCOME", "EUR"));
    expect(result.current.rows[0].currency).toBe("EUR");

    fillValidRow(result, { currency: "COP" });
    await act(async () => {
      await result.current.save();
    });

    expect(createMock).toHaveBeenCalledWith(expect.objectContaining({ currency: "COP" }));
  });

  it("backfills recurring rows by anchoring startDate six months back", async () => {
    const { result } = renderHook(() => useRecurrentStep("INCOME", "USD"));
    fillValidRow(result, { dayOfMonth: 15 });

    await act(async () => {
      await result.current.save();
    });

    const sent = new Date(createMock.mock.calls[0][0].startDate);
    const now = new Date();
    const expected = new Date(now.getFullYear(), now.getMonth() - 6, 15);
    expect(sent.getFullYear()).toBe(expected.getFullYear());
    expect(sent.getMonth()).toBe(expected.getMonth());
    expect(sent.getDate()).toBe(15);
  });

  it("does not backfill when the option is turned off", async () => {
    const { result } = renderHook(() => useRecurrentStep("INCOME", "USD"));
    act(() => result.current.setBackfill(false));
    fillValidRow(result, { dayOfMonth: 15 });

    await act(async () => {
      await result.current.save();
    });

    const sent = new Date(createMock.mock.calls[0][0].startDate);
    expect(sent.getMonth()).toBe(new Date().getMonth());
    expect(sent.getDate()).toBe(15);
  });

  it("records a one-time row as a dated transaction, never a plan and never backfilled", async () => {
    const { result } = renderHook(() => useRecurrentStep("EXPENSE", "USD"));
    fillValidRow(result, { frequency: "ONE_TIME", date: "2026-03-09" });

    await act(async () => {
      await result.current.save();
    });

    expect(createMock).not.toHaveBeenCalled();
    const body = createTransactionMock.mock.calls[0][0];
    expect(body.status).toBe("PAID");
    const sent = new Date(body.occurredAt);
    expect([sent.getFullYear(), sent.getMonth(), sent.getDate()]).toEqual([2026, 2, 9]);
  });

  it("tags items in the Subscriptions category as SUBSCRIPTION", async () => {
    const { result } = renderHook(() => useRecurrentStep("EXPENSE", "USD"));
    fillValidRow(result, { categoryId: "cat-subs", name: "Netflix", amount: "15.49" });

    await act(async () => {
      await result.current.save();
    });

    expect(createMock).toHaveBeenCalledWith(expect.objectContaining({ type: "SUBSCRIPTION" }));
  });

  it("addTo seeds the row with the section's frequency", () => {
    const { result } = renderHook(() => useRecurrentStep("EXPENSE", "USD"));
    act(() => result.current.addTo("YEARLY"));
    expect(result.current.rows[1].frequency).toBe("YEARLY");
  });

  it("skips rows that are blank or only partially filled", async () => {
    const { result } = renderHook(() => useRecurrentStep("EXPENSE", "USD"));

    // Name and amount present, but no category picked.
    act(() => result.current.update(result.current.rows[0].key, { name: "Rent", amount: "1400" }));
    await act(async () => {
      expect(await result.current.save()).toBe(0);
    });

    // Category and name, but a non-positive amount.
    act(() =>
      result.current.update(result.current.rows[0].key, { categoryId: "cat1", amount: "0" })
    );
    await act(async () => {
      expect(await result.current.save()).toBe(0);
    });

    expect(createMock).not.toHaveBeenCalled();
  });

  it("deletes a saved row from Firestore, not just from local state", async () => {
    const { result } = renderHook(() => useRecurrentStep("INCOME", "USD"));

    fillValidRow(result);
    await act(async () => {
      await result.current.save();
    });
    const savedKey = result.current.rows[0].key;
    expect(result.current.rows[0].id).toBe("new-rt");

    act(() => result.current.removeAt(savedKey));

    // Without the API call the row would come back on the next visit.
    expect(removeMock).toHaveBeenCalledWith("new-rt");
    expect(result.current.rows.some((r) => r.key === savedKey)).toBe(false);
  });

  it("does not hit the API when removing a row that was never saved", () => {
    const { result } = renderHook(() => useRecurrentStep("INCOME", "USD"));

    act(() => result.current.add());
    const unsavedKey = result.current.rows[1].key;

    act(() => result.current.removeAt(unsavedKey));

    expect(removeMock).not.toHaveBeenCalled();
    expect(result.current.rows.some((r) => r.key === unsavedKey)).toBe(false);
  });

  it("hydrates from already-saved transactions, including currency and schedule", async () => {
    loadingValue = true;
    const { result, rerender } = renderHook(() => useRecurrentStep("INCOME", "USD"));
    expect(result.current.rows).toHaveLength(1);

    itemsValue = [
      {
        id: "rt1",
        categoryId: "cat1",
        name: "Freelance",
        amount: 1200,
        currency: "EUR",
        frequency: "MONTHLY",
        paymentMethodId: "pm1",
        startDate: ts(new Date(2026, 2, 17, 12)),
      },
    ];
    loadingValue = false;
    rerender();

    await waitFor(() => expect(result.current.rows[0].name).toBe("Freelance"));
    expect(result.current.rows[0].id).toBe("rt1");
    // Amounts round-trip through a string, since the input is text.
    expect(result.current.rows[0].amount).toBe("1200");
    expect(result.current.rows[0].paymentMethodId).toBe("pm1");
    expect(result.current.rows[0].currency).toBe("EUR");
    expect(result.current.rows[0].dayOfMonth).toBe(17);
  });

  describe("editing what is already saved", () => {
    const saved = () => [
      {
        id: "rt1",
        categoryId: "cat1",
        name: "Freelance",
        amount: 1200,
        currency: "EUR",
        frequency: "MONTHLY",
        type: "SALARY",
        startDate: ts(new Date(2026, 2, 17, 12)),
      },
    ];

    const hydrated = async () => {
      itemsValue = saved();
      const hook = renderHook(() => useRecurrentStep("INCOME", "USD"));
      await waitFor(() => expect(hook.result.current.rows[0].id).toBe("rt1"));
      return hook;
    };

    it("sends only the fields that changed", async () => {
      const { result } = await hydrated();
      act(() => result.current.update(result.current.rows[0].key, { amount: "1500" }));
      await act(async () => {
        await result.current.save();
      });

      expect(updateMock).toHaveBeenCalledWith("rt1", { amount: 1500 });
      expect(createMock).not.toHaveBeenCalled();
    });

    it("leaves an untouched saved row alone, history included", async () => {
      const { result } = await hydrated();
      await act(async () => {
        await result.current.save();
      });
      expect(updateMock).not.toHaveBeenCalled();
    });

    it("refuses to save a saved row that was emptied", async () => {
      const { result } = await hydrated();
      act(() => result.current.update(result.current.rows[0].key, { name: " " }));

      await expect(result.current.save()).rejects.toThrow(SAVED_ROW_ERROR);
      expect(updateMock).not.toHaveBeenCalled();
    });

    it("edits a one-time row saved earlier on the step as a transaction", async () => {
      const { result } = renderHook(() => useRecurrentStep("EXPENSE", "USD"));
      fillValidRow(result, { frequency: "ONE_TIME", date: "2026-03-10" });
      await act(async () => {
        await result.current.save();
      });
      expect(result.current.rows[0].id).toBe("tx1");

      act(() => result.current.update(result.current.rows[0].key, { amount: "80" }));
      await act(async () => {
        await result.current.save();
      });
      expect(updateTransactionMock).toHaveBeenCalledWith("tx1", { amount: 80 });

      // Saved again: a second save with no change sends nothing more.
      await act(async () => {
        await result.current.save();
      });
      expect(updateTransactionMock).toHaveBeenCalledTimes(1);
    });
  });
});
