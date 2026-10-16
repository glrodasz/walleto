import { accountDraftOf, emptyAccountDraft, readAccountDraft } from "./accountDraft";
import { parseDecimal } from "../utils/decimal";

const parse = (raw: string) => parseDecimal(raw, ".");

describe("accountDraft", () => {
  it("starts empty in the given currency, yearly", () => {
    expect(emptyAccountDraft("SEK")).toEqual({
      name: "",
      provider: "",
      currency: "SEK",
      rate: "",
      period: "YEARLY",
    });
  });

  it("prefills from an account", () => {
    const draft = accountDraftOf(
      {
        id: "a",
        userId: "u",
        domain: "SAVING",
        name: "Buffer",
        provider: "SEB",
        currency: "SEK",
        interestRate: { value: 2.5, period: "MONTHLY" },
      },
      String
    );
    expect(draft).toEqual({
      name: "Buffer",
      provider: "SEB",
      currency: "SEK",
      rate: "2.5",
      period: "MONTHLY",
    });
  });

  it("requires a name", () => {
    expect(readAccountDraft({ ...emptyAccountDraft("SEK"), name: "  " }, parse, "SAVING")).toEqual({
      error: "Give the pocket a name",
    });
  });

  it("rejects a rate outside 0–100", () => {
    const draft = { ...emptyAccountDraft("SEK"), name: "Buffer", rate: "120" };
    expect(readAccountDraft(draft, parse, "SAVING")).toEqual({
      error: "Interest rate must be between 0 and 100",
    });
  });

  it("reads empty optionals as null and trims", () => {
    const draft = { ...emptyAccountDraft("USD"), name: " ISK ", provider: " " };
    expect(readAccountDraft(draft, parse, "INVESTMENT")).toEqual({
      values: { name: "ISK", provider: null, currency: "USD", interestRate: null },
    });
  });

  it("reads a comma-typed rate with its period", () => {
    const draft = {
      ...emptyAccountDraft("SEK"),
      name: "Buffer",
      provider: "SEB",
      rate: "2,85",
      period: "MONTHLY" as const,
    };
    expect(readAccountDraft(draft, parse, "SAVING")).toEqual({
      values: {
        name: "Buffer",
        provider: "SEB",
        currency: "SEK",
        interestRate: { value: 2.85, period: "MONTHLY" },
      },
    });
  });
});

describe("accountDraft in Spanish", () => {
  it("names the thing with its own gender", () => {
    const empty = { ...emptyAccountDraft("COP"), name: "" };
    expect(readAccountDraft(empty, parse, "SAVING", "es")).toEqual({
      error: "Ponle un nombre al bolsillo",
    });
    expect(readAccountDraft(empty, parse, "DEBT", "es")).toEqual({
      error: "Ponle un nombre a la deuda",
    });
  });
});
