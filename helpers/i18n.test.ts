import { defineMessages, t, translate } from "./i18n";

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
