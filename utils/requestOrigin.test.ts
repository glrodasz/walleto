import { requestOrigin } from "./requestOrigin";

describe("requestOrigin", () => {
  it("prefers the forwarded host and protocol a proxy sets", () => {
    expect(
      requestOrigin({
        host: "internal:3000",
        "x-forwarded-host": "sublr-abc-team.vercel.app",
        "x-forwarded-proto": "https",
      })
    ).toBe("https://sublr-abc-team.vercel.app");
  });

  it("falls back to the Host header with https", () => {
    expect(requestOrigin({ host: "sublr-git-branch-team.vercel.app" })).toBe(
      "https://sublr-git-branch-team.vercel.app"
    );
  });

  it("uses http for localhost and keeps the port", () => {
    expect(requestOrigin({ host: "localhost:3000" })).toBe("http://localhost:3000");
    expect(requestOrigin({ host: "127.0.0.1:3000" })).toBe("http://127.0.0.1:3000");
  });

  it("takes the first value of a comma-separated or array header", () => {
    expect(
      requestOrigin({
        "x-forwarded-host": "a.example.com, b.example.com",
        "x-forwarded-proto": ["https", "http"],
      })
    ).toBe("https://a.example.com");
  });

  it("returns null without a host", () => {
    expect(requestOrigin({})).toBeNull();
    expect(requestOrigin({ host: "" })).toBeNull();
  });
});
