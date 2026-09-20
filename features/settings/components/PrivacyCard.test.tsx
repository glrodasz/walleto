import { fireEvent, render, screen } from "@testing-library/react";
import { PrivacyCard } from "./PrivacyCard";

jest.mock("../hooks/useDeleteAccount", () => ({
  useDeleteAccount: () => ({ deleteAccount: jest.fn(), deleting: false, error: null }),
}));

afterEach(() => {
  document.body.style.overflow = "";
});

describe("PrivacyCard", () => {
  it("links the policy and the export, and opens the deletion dialog", () => {
    render(<PrivacyCard />);
    expect(screen.getByRole("link", { name: /Privacy policy/ })).toHaveAttribute(
      "href",
      "/privacy"
    );
    expect(screen.getByRole("link", { name: /Data export/ })).toHaveAttribute(
      "href",
      "/api/account/export"
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Delete account/ }));
    expect(screen.getByRole("dialog", { name: "Delete your account" })).toBeInTheDocument();
  });
});
