import { saveAll } from "./saveAll";

describe("saveAll", () => {
  it("starts every save before any finishes", async () => {
    const started: number[] = [];
    const resolvers: (() => void)[] = [];
    const run = saveAll(
      [1, 2, 3],
      (n) =>
        new Promise<number>((resolve) => {
          started.push(n);
          resolvers.push(() => resolve(n * 10));
        }),
      () => {}
    );
    expect(started).toEqual([1, 2, 3]);
    resolvers.forEach((r) => r());
    await expect(run).resolves.toBe(3);
  });

  it("reports each success with its result", async () => {
    const onSaved = jest.fn();
    await saveAll(["a", "b"], async (s) => s.toUpperCase(), onSaved);
    expect(onSaved.mock.calls).toEqual([
      ["a", "A"],
      ["b", "B"],
    ]);
  });

  it("keeps the successes and re-throws the first failure after all settle", async () => {
    const onSaved = jest.fn();
    const boom = new Error("boom");
    await expect(
      saveAll(
        [1, 2, 3],
        async (n) => {
          if (n === 2) throw boom;
          if (n === 3) throw new Error("later");
          return n;
        },
        onSaved
      )
    ).rejects.toBe(boom);
    expect(onSaved).toHaveBeenCalledWith(1, 1);
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it("resolves to 0 for nothing to save", async () => {
    await expect(saveAll([], async () => 1, jest.fn())).resolves.toBe(0);
  });
});
