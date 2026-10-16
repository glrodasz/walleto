import {
  defineMessages,
  negotiateLanguage,
  parseAcceptLanguage,
  readCookie,
  resolveLanguage,
  t,
  translate,
} from "./i18n";
import { requestLanguage } from "./requestLanguage";

describe("t", () => {
  it("returns the English message by default", () => {
    expect(t("theme.system")).toBe("System");
    expect(t("settings.privacy.title", "en")).toBe("Data & privacy");
  });

  it("speaks Spanish", () => {
    expect(t("settings.privacy.title", "es")).toBe("Datos y privacidad");
  });

  it("falls back to English for a language without a catalog", () => {
    expect(t("theme.dark", "xx" as never)).toBe("Dark");
  });
});

describe("translate", () => {
  const messages = defineMessages(
    { greet: "Hi {name}", months: { one: "{count} month", other: "{count} months" } },
    { greet: "Hola {name}", months: { one: "{count} mes", other: "{count} meses" } }
  );

  it("interpolates params", () => {
    expect(translate(messages, "es", "greet", { name: "Ada" })).toBe("Hola Ada");
  });

  it("picks the plural form per language", () => {
    expect(translate(messages, "en", "months", { count: 1 })).toBe("1 month");
    expect(translate(messages, "en", "months", { count: 0 })).toBe("0 months");
    expect(translate(messages, "es", "months", { count: 1 })).toBe("1 mes");
    expect(translate(messages, "es", "months", { count: 4 })).toBe("4 meses");
  });

  it("leaves an unknown placeholder visible", () => {
    expect(translate(messages, "en", "greet")).toBe("Hi {name}");
  });
});

describe("language negotiation", () => {
  it("orders Accept-Language by q, then position", () => {
    expect(parseAcceptLanguage("sv, es;q=0.8, en;q=0.9")).toEqual(["sv", "en", "es"]);
    expect(parseAcceptLanguage("*, fr;q=0")).toEqual([]);
    expect(parseAcceptLanguage(undefined)).toEqual([]);
  });

  it("takes the first language we speak, in the user's order", () => {
    expect(negotiateLanguage(["sv", "es-CO"])).toBe("es");
    expect(negotiateLanguage(["en-US", "es"])).toBe("en");
    expect(negotiateLanguage(["sv"])).toBeNull();
  });

  // pathname-free version of the shared truth table: the saved choice beats
  // the browser, the browser beats the default, junk is ignored.
  it.each([
    [null, ["es-ES"], "es"],
    [null, ["sv", "es"], "es"],
    [null, ["en-US", "es"], "en"],
    ["es", ["en-US"], "es"],
    ["en", ["es-ES"], "en"],
    ["garbage", ["es"], "es"],
    [null, [], "en"],
  ])("cookie %s + %j → %s", (cookie, languages, expected) => {
    expect(resolveLanguage({ cookie, languages })).toBe(expected);
  });

  it("reads the cookie by name", () => {
    expect(readCookie("a=1; locale=es; b=2", "locale")).toBe("es");
    expect(readCookie("xlocale=es", "locale")).toBeNull();
  });

  it("resolves a request from its headers", () => {
    expect(requestLanguage({ headers: { "accept-language": "es-CO,es;q=0.9" } })).toBe("es");
    expect(requestLanguage({ headers: { cookie: "locale=en", "accept-language": "es-CO" } })).toBe(
      "en"
    );
  });
});
