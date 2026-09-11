import { t } from "./i18n";

describe("t", () => {
  it("returns the English message by default", () => {
    expect(t("theme.system")).toBe("System");
    expect(t("settings.privacy.title", "en")).toBe("Data & privacy");
  });

  it("falls back to English for a language without a catalog", () => {
    expect(t("theme.dark", "xx" as never)).toBe("Dark");
  });
});
