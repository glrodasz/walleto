import { render, screen } from "@testing-library/react";
import { PRIVACY_POLICY_UPDATED, PrivacyPage } from "./PrivacyPage";

describe("PrivacyPage", () => {
  it("states the essentials: controller contact, processors, rights and the date", () => {
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL = "hello@example.com";
    render(<PrivacyPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Privacy policy" })).toBeInTheDocument();
    expect(screen.getByText(`Last updated ${PRIVACY_POLICY_UPDATED}`)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "hello@example.com" })[0]).toHaveAttribute(
      "href",
      "mailto:hello@example.com"
    );
    for (const processor of ["Auth0 by Okta", "Vercel", "Gravatar (Automattic)"]) {
      expect(screen.getByText(processor)).toBeInTheDocument();
    }
    expect(screen.getByRole("heading", { name: "Your rights" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to Waletto" })).toHaveAttribute("href", "/");
  });
});
