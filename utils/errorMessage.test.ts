import { UserFacingError, errorMessage } from "./errorMessage";

describe("errorMessage", () => {
  it("shows a UserFacingError as is", () => {
    expect(errorMessage(new UserFacingError("Enter all 4 digits"), "fallback")).toBe(
      "Enter all 4 digits"
    );
  });

  it("shows the sentence an API route wrote", () => {
    const err = new Error(
      JSON.stringify({ error: 'You already have a Credit card called "Visa"' })
    );
    expect(errorMessage(err, "fallback")).toBe('You already have a Credit card called "Visa"');
  });

  it("falls back for a Zod flatten body", () => {
    const err = new Error(
      JSON.stringify({
        error: { formErrors: [], fieldErrors: { last4: ["Must be exactly 4 digits"] } },
      })
    );
    expect(errorMessage(err, "fallback")).toBe("fallback");
  });

  it("falls back for plain errors and non-errors", () => {
    expect(errorMessage(new Error("Failed to fetch"), "fallback")).toBe("fallback");
    expect(errorMessage(new Error(JSON.stringify({ error: "  " })), "fallback")).toBe("fallback");
    expect(errorMessage("boom", "fallback")).toBe("fallback");
  });
});
