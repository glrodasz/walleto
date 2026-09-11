import { buildInfo } from "./buildInfo";

const SHA = "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b";

describe("buildInfo", () => {
  it("names production without pointing at a commit", () => {
    const info = buildInfo("production", SHA);
    expect(info).toEqual({
      env: "production",
      label: "Alpha",
      shortSha: null,
      commitUrl: null,
    });
  });

  it("names a preview and links its commit", () => {
    const info = buildInfo("preview", SHA);
    expect(info.env).toBe("preview");
    expect(info.label).toBe("Staging");
    expect(info.shortSha).toBe("1a2b3c4");
    expect(info.commitUrl).toBe(`https://github.com/glrodasz/walleto/commit/${SHA}`);
  });

  it("drops the link when a preview has no commit", () => {
    expect(buildInfo("preview", "")).toMatchObject({ shortSha: null, commitUrl: null });
    expect(buildInfo("preview", undefined)).toMatchObject({ shortSha: null, commitUrl: null });
    expect(buildInfo("preview", "   ")).toMatchObject({ shortSha: null, commitUrl: null });
  });

  it("treats anything unset or unrecognised as local development", () => {
    for (const env of [undefined, "", "dev", "staging", "PRODUCTION"]) {
      expect(buildInfo(env, SHA)).toEqual({
        env: "development",
        label: "Dev",
        shortSha: null,
        commitUrl: null,
      });
    }
  });
});
