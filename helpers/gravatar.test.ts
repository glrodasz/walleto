import { gravatarUrl } from "./gravatar";

describe("gravatarUrl", () => {
  it("hashes the email with SHA-256, matching Gravatar's documented example", () => {
    // https://docs.gravatar.com/api/avatars/images/ uses this exact pair.
    const url = gravatarUrl("MyEmailAddress@example.com");
    expect(url).toBe(
      "https://www.gravatar.com/avatar/84059b07d4be67b806386c0aad8070a23f18836bbaae342275dc0a83414c32ee?s=64&d=404"
    );
  });

  it("normalizes case and surrounding whitespace before hashing", () => {
    const a = gravatarUrl("Person@Example.com");
    const b = gravatarUrl("  person@example.com  ");
    expect(a).toBe(b);
  });

  it("requests a 404 instead of a default placeholder image", () => {
    expect(gravatarUrl("a@b.com")).toContain("d=404");
  });

  it("honors a custom size", () => {
    expect(gravatarUrl("a@b.com", 128)).toContain("s=128");
  });
});
