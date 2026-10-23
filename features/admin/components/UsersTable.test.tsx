import { render, screen } from "@testing-library/react";
import { UsersTable, maskEmail } from "./UsersTable";
import type { AdminUserRow } from "../types";

const row = (over: Partial<AdminUserRow> = {}): AdminUserRow => ({
  id: "auth0|a",
  email: "ana@example.com",
  name: "Ana",
  signedUpAt: "2026-09-01T00:00:00.000Z",
  lastLoginAt: null,
  logins: 3,
  lastSeenAt: null,
  lastActiveAt: null,
  onboarded: true,
  counts: { recurring: 5, transactions: 40, accounts: 2 },
  ...over,
});

describe("maskEmail", () => {
  it("keeps the first letter and the domain", () => {
    expect(maskEmail("guillermo@gmail.com")).toBe("g••••@gmail.com");
    expect(maskEmail("nope")).toBe("••••");
  });
});

describe("UsersTable", () => {
  it("shows each person with their counts", () => {
    render(<UsersTable users={[row()]} />);
    expect(screen.getByText("ana@example.com")).toBeInTheDocument();
    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(screen.getByText("40")).toBeInTheDocument();
    expect(screen.getByText("Never")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
  });

  it("falls back to the user id without Auth0 data", () => {
    render(
      <UsersTable users={[row({ email: null, name: null, logins: null, onboarded: false })]} />
    );
    expect(screen.getByText("auth0|a")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("says so when nobody has signed up", () => {
    render(<UsersTable users={[]} />);
    expect(screen.getByText("Nobody has signed up yet.")).toBeInTheDocument();
  });
});
