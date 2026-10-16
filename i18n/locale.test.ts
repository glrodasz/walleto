import {
  alternateLinks,
  localizePath,
  negotiateLocale,
  parseAcceptLanguage,
  readCookie,
  resolveLocaleRedirect,
  switchLocalePath,
} from "./locale";

describe("resolveLocaleRedirect — the shared truth table", () => {
  it.each([
    ["/", null, "es-ES", "/es"],
    ["/about", null, "sv, es;q=0.8", "/es/about"],
    ["/", null, "en-US, es", null],
    ["/", "es", "en-US", "/es"],
    ["/", "en", "es-ES", null],
    ["/es/about", "en", "en", null],
    ["/api/subscribe", "es", "es", null],
    ["/apis", null, "es", "/es/apis"],
    ["/", "garbage", "es", "/es"],
    // This app's exemptions: Auth0 callbacks, Next assets, Storybook.
    ["/api/auth/callback", null, "es", null],
    ["/storybook/index.html", null, "es", null],
    ["/settings", null, "es-CO", "/es/settings"],
  ])("%s · cookie %s · %s → %s", (pathname, savedLocale, header, expected) => {
    expect(
      resolveLocaleRedirect({
        pathname,
        savedLocale,
        languages: parseAcceptLanguage(header),
      })
    ).toBe(expected);
  });
});

describe("paths", () => {
  it("round-trips between locales", () => {
    expect(localizePath("/es", "en")).toBe("/");
    expect(localizePath("/", "es")).toBe("/es");
    expect(localizePath("/settings", "es")).toBe("/es/settings");
    expect(switchLocalePath("/es/about", "en")).toBe("/about");
    expect(switchLocalePath("/about", "es")).toBe("/es/about");
  });

  it("honours alternates and falls back to the locale home", () => {
    expect(switchLocalePath("/x", "es", { en: "/x", es: "/es/y" })).toBe("/es/y");
    expect(switchLocalePath("/x", "es", { en: "/x" })).toBe("/es");
  });

  it("lists alternates with x-default", () => {
    expect(alternateLinks("/settings", "https://a.test").map((l) => l.hreflang)).toEqual([
      "en",
      "es",
      "x-default",
    ]);
  });
});

describe("negotiation", () => {
  it("orders Accept-Language by q, then position", () => {
    expect(parseAcceptLanguage("sv, es;q=0.8, en;q=0.9")).toEqual(["sv", "en", "es"]);
    expect(parseAcceptLanguage("*, fr;q=0")).toEqual([]);
    expect(parseAcceptLanguage(null)).toEqual([]);
  });

  it("takes the first supported base language", () => {
    expect(negotiateLocale(["sv", "es-CO"])).toBe("es");
    expect(negotiateLocale(["en-US", "es"])).toBe("en");
    expect(negotiateLocale(["sv"])).toBe("en");
  });

  it("reads a cookie by name", () => {
    expect(readCookie("a=1; locale=es; b=2", "locale")).toBe("es");
    expect(readCookie("xlocale=es", "locale")).toBeNull();
  });
});
