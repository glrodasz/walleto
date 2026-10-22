import { landingLanguageFor, signInHref, signUpHref } from "./routes";

describe("landing routes", () => {
  it("pins the language of /en and /es only", () => {
    expect(landingLanguageFor("/en")).toBe("en");
    expect(landingLanguageFor("/es")).toBe("es");
    expect(landingLanguageFor("/")).toBeNull();
    expect(landingLanguageFor("/expenses")).toBeNull();
  });

  it("opens Universal Login on sign-up, in the page's language", () => {
    expect(signUpHref("es")).toBe("/api/auth/login?screen_hint=signup&ui_locales=es");
    expect(signInHref("en")).toBe("/api/auth/login?ui_locales=en");
  });
});
