import { adminUserIds, isAdmin } from "./admin";

describe("adminUserIds", () => {
  it("splits and trims the comma-separated list", () => {
    expect(adminUserIds(" auth0|a , google-oauth2|b,,")).toEqual(["auth0|a", "google-oauth2|b"]);
  });

  it("is empty when the variable is unset", () => {
    expect(adminUserIds(undefined)).toEqual([]);
    expect(adminUserIds("")).toEqual([]);
  });
});

describe("isAdmin", () => {
  it("lets in only a listed id", () => {
    expect(isAdmin("auth0|a", "auth0|a")).toBe(true);
    expect(isAdmin("auth0|b", "auth0|a")).toBe(false);
  });

  it("lets nobody in when no ids are configured", () => {
    expect(isAdmin("auth0|a", "")).toBe(false);
  });

  it("never matches a missing session", () => {
    expect(isAdmin(undefined, "auth0|a")).toBe(false);
    expect(isAdmin("", ",")).toBe(false);
  });
});
