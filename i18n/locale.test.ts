import {
  negotiateLocale,
  parseAcceptLanguage,
  readCookie,
  requestLocale,
  resolveLocale,
} from "./locale";

describe("resolveLocale — the skill's truth table, without URLs", () => {
  it.each([
    [null, "es-ES", "es"],
    [null, "sv, es;q=0.8", "es"],
    [null, "en-US, es", "en"],
    ["es", "en-US", "es"],
    ["en", "es-ES", "en"],
    ["garbage", "es", "es"],
    [null, "", "en"],
  ])("cookie %s · %s → %s", (savedLocale, header, expected) => {
    expect(resolveLocale({ savedLocale, languages: parseAcceptLanguage(header) })).toBe(expected);
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

describe("requestLocale", () => {
  it("resolves a request from its headers", () => {
    expect(requestLocale({ headers: { "accept-language": "es-CO,es;q=0.9" } })).toBe("es");
    expect(requestLocale({ headers: { cookie: "locale=en", "accept-language": "es-CO" } })).toBe(
      "en"
    );
  });

  it("reads the browser on a client-side navigation", () => {
    document.cookie = "locale=es; path=/";
    expect(requestLocale()).toBe("es");
    document.cookie = "locale=; path=/; max-age=0";
  });
});
