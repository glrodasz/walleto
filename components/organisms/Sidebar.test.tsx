import { fireEvent, render, screen, within } from "@testing-library/react";
import { Sidebar } from "./Sidebar";

let pathname = "/";
jest.mock("next/router", () => ({
  useRouter: () => ({ pathname }),
}));
jest.mock("@auth0/nextjs-auth0/client", () => ({
  useUser: () => ({ user: { name: "Ada Lovelace", email: "ada@example.com" } }),
}));

// The bottom nav is display:none outside the mobile media query, which jsdom
// never matches, so its contents must be queried as hidden.
const hidden = { hidden: true } as const;

function mobileNav() {
  const nav = document.querySelector('nav[aria-label="Mobile navigation"]') as HTMLElement;
  expect(nav).not.toBeNull();
  const q = within(nav);
  return {
    link: (name: string) => q.queryByRole("link", { name, ...hidden }),
    more: () => q.getByRole("button", { name: "More", ...hidden }),
  };
}

describe("Sidebar mobile navigation", () => {
  beforeEach(() => {
    pathname = "/";
  });

  it("keeps the four direct tabs and reaches the rest through More", () => {
    render(<Sidebar />);
    const nav = mobileNav();
    expect(nav.link("Home")).toHaveAttribute("href", "/");
    expect(nav.link("Invest")).toHaveAttribute("href", "/investments");
    expect(nav.link("Savings")).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(nav.more());

    const sheet = screen.getByRole("dialog", { name: "More" });
    for (const [label, href] of [
      ["Savings", "/savings"],
      ["Prospect", "/prospect"],
      ["Settings", "/settings"],
      ["Log out", "/api/auth/logout"],
    ]) {
      expect(within(sheet).getByRole("link", { name: label })).toHaveAttribute("href", href);
    }
    expect(within(sheet).getByText("ada@example.com")).toBeInTheDocument();
    // Payment methods moved into Settings; the sheet no longer links to /methods.
    expect(within(sheet).queryByRole("link", { name: "Methods" })).toBeNull();
  });

  it("lists Dashboard first and Settings as the only account destination on desktop", () => {
    render(<Sidebar />);
    const nav = screen.getByRole("navigation", { name: "Main navigation" });
    const links = within(nav).getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", "/");
    expect(within(nav).queryByRole("link", { name: "Methods" })).toBeNull();
    expect(within(nav).getByRole("link", { name: "Settings" })).toHaveAttribute(
      "href",
      "/settings"
    );
  });

  it("closes the sheet when a destination is chosen and marks More active on those pages", () => {
    pathname = "/savings";
    render(<Sidebar />);
    const more = mobileNav().more();
    expect(more.className).toContain("is-active");

    fireEvent.click(more);
    const sheet = screen.getByRole("dialog", { name: "More" });
    expect(within(sheet).getByRole("link", { name: "Savings" })).toHaveAttribute(
      "aria-current",
      "page"
    );

    fireEvent.click(within(sheet).getByRole("link", { name: "Prospect" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
