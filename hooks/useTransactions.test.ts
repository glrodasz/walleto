import { createTransaction, deleteTransaction } from "./useTransactions";

const fetchMock = jest.fn();
global.fetch = fetchMock as unknown as typeof fetch;

const input = {
  domain: "EXPENSE" as const,
  categoryId: "c1",
  name: "Bread",
  amount: 12.5,
  currency: "USD" as const,
  occurredAt: "2026-06-15T12:00:00.000Z",
  status: "PAID" as const,
};

beforeEach(() => fetchMock.mockReset());

describe("createTransaction", () => {
  it("posts the input and resolves the new id", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ id: "t1" }) });
    await expect(createTransaction(input)).resolves.toBe("t1");
    expect(fetchMock).toHaveBeenCalledWith("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  });

  it("throws the response text on failure", async () => {
    fetchMock.mockResolvedValue({ ok: false, text: async () => "Category not found" });
    await expect(createTransaction(input)).rejects.toThrow("Category not found");
  });
});

describe("deleteTransaction", () => {
  it("sends DELETE to the transaction route", async () => {
    fetchMock.mockResolvedValue({ ok: true });
    await deleteTransaction("t1");
    expect(fetchMock).toHaveBeenCalledWith("/api/transactions/t1", { method: "DELETE" });
  });
});
