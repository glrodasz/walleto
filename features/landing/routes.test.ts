import { landingLanguageFor, signInHref } from "./routes";

describe("landing routes", () => {
  it("pins the language of /en and /es only", () => {
    expect(landingLanguageFor("/en")).toBe("en");
    expect(landingLanguageFor("/es")).toBe("es");
    expect(landingLanguageFor("/")).toBeNull();
    expect(landingLanguageFor("/expenses")).toBeNull();
  });

  it("opens Universal Login in the page's language", () => {
    expect(signInHref("es")).toBe("/api/auth/login?ui_locales=es");
  });
});
