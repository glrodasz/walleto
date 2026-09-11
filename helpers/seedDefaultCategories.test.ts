const whereMock = jest.fn();
const getMock = jest.fn();
const batchSetMock = jest.fn();
const batchCommitMock = jest.fn();
const docMock = jest.fn();

jest.mock("../firebase/admin", () => ({
  __esModule: true,
  default: {
    firestore: Object.assign(
      jest.fn(() => ({
        collection: () => ({ where: whereMock, doc: docMock }),
        batch: () => ({ set: batchSetMock, commit: batchCommitMock }),
      })),
      { FieldValue: { serverTimestamp: jest.fn(() => "SERVER_TIMESTAMP") } }
    ),
  },
}));

jest.mock("../data/defaultCategories.json", () => ({
  INCOME: ["Salary", "Rent"],
  EXPENSE: ["Subscriptions"],
}));

import { seedDefaultCategories } from "./seedDefaultCategories";

const existing = (rows: { domain: string; name: string }[]) => {
  getMock.mockResolvedValue({ docs: rows.map((r) => ({ data: () => r })) });
};

beforeEach(() => {
  whereMock.mockReset().mockReturnValue({ where: whereMock, get: getMock });
  getMock.mockReset();
  batchSetMock.mockReset();
  batchCommitMock.mockReset().mockResolvedValue(undefined);
  docMock.mockReset().mockReturnValue({ id: "generated" });
});

describe("seedDefaultCategories", () => {
  it("creates every default for a brand new user", async () => {
    existing([]);
    const created = await seedDefaultCategories("user1");
    expect(created).toBe(3);
    expect(batchSetMock).toHaveBeenCalledTimes(3);
    expect(batchCommitMock).toHaveBeenCalled();
  });

  it("skips defaults the user already has", async () => {
    existing([
      { domain: "INCOME", name: "Salary" },
      { domain: "EXPENSE", name: "Subscriptions" },
    ]);
    const created = await seedDefaultCategories("user1");
    expect(created).toBe(1);
    expect(batchSetMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ domain: "INCOME", name: "Rent", userId: "user1", icon: "home" })
    );
  });

  it("matches existing names case-insensitively", async () => {
    existing([
      { domain: "INCOME", name: "salary" },
      { domain: "INCOME", name: "RENT" },
      { domain: "EXPENSE", name: "subscriptions" },
    ]);
    expect(await seedDefaultCategories("user1")).toBe(0);
  });

  it("does not treat a same-named category in another domain as a match", async () => {
    // "Rent" exists as an expense; the income default must still be created.
    existing([{ domain: "EXPENSE", name: "Rent" }]);
    const created = await seedDefaultCategories("user1");
    expect(created).toBe(3);
  });

  it("skips the commit entirely when there is nothing to create", async () => {
    existing([
      { domain: "INCOME", name: "Salary" },
      { domain: "INCOME", name: "Rent" },
      { domain: "EXPENSE", name: "Subscriptions" },
    ]);
    expect(await seedDefaultCategories("user1")).toBe(0);
    expect(batchCommitMock).not.toHaveBeenCalled();
  });
});
