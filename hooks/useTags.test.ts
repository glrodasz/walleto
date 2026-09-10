jest.mock("../firebase/client", () => ({ db: {} }));

import { createTag, removeTag, updateTag } from "./useTags";

const fetchMock = jest.fn();
global.fetch = fetchMock as unknown as typeof fetch;

beforeEach(() => fetchMock.mockReset());

describe("tag fetch helpers", () => {
  it("creates, updates and removes through the tags routes", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ id: "t1" }) });
    await expect(createTag("Trip 2026")).resolves.toBe("t1");
    expect(fetchMock).toHaveBeenLastCalledWith("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Trip 2026" }),
    });

    await updateTag("t1", { name: "Trip" });
    expect(fetchMock).toHaveBeenLastCalledWith("/api/tags/t1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Trip" }),
    });

    await removeTag("t1");
    expect(fetchMock).toHaveBeenLastCalledWith("/api/tags/t1", { method: "DELETE" });
  });

  it("throws the response text on failure", async () => {
    fetchMock.mockResolvedValue({ ok: false, text: async () => "already exists" });
    await expect(createTag("x")).rejects.toThrow("already exists");
    await expect(updateTag("t1", { name: "y" })).rejects.toThrow("already exists");
    await expect(removeTag("t1")).rejects.toThrow("already exists");
  });
});
