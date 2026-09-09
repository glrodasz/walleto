import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AccountsSettings } from "./AccountsSettings";

const update = jest.fn().mockResolvedValue(undefined);
const remove = jest.fn().mockResolvedValue(undefined);
let lastDomain = "";
jest.mock("../../../hooks/useAccounts", () => ({
  useAccounts: (domain: string) => {
    lastDomain = domain;
    return {
      accounts:
        domain === "SAVING"
          ? [
              {
                id: "seb",
                userId: "u",
                domain,
                name: "Savings",
                provider: "SEB",
                currency: "SEK",
                interestRate: { value: 2.5, period: "YEARLY" },
              },
            ]
          : [{ id: "isk", userId: "u", domain, name: "ISK", currency: "SEK" }],
      loading: false,
      error: null,
      update,
      remove,
    };
  },
}));

beforeEach(() => {
  update.mockClear();
  remove.mockClear();
});

describe("AccountsSettings", () => {
  it("lists the domain's accounts with their rate and switches domains", () => {
    render(<AccountsSettings />);
    expect(lastDomain).toBe("INVESTMENT");
    expect(screen.getByText("ISK")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Savings" }));
    expect(screen.getByText("SEB - Savings")).toBeInTheDocument();
    expect(screen.getByText("SEK · 2.5% yearly")).toBeInTheDocument();
  });

  it("edits a pocket inline and archives through the kebab", async () => {
    render(<AccountsSettings />);
    fireEvent.click(screen.getByRole("tab", { name: "Savings" }));

    fireEvent.click(screen.getByRole("button", { name: "Actions for Savings" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Emergency" } });
    fireEvent.change(screen.getByLabelText("Interest rate %"), { target: { value: "0.3" } });
    fireEvent.change(screen.getByLabelText("Period"), { target: { value: "MONTHLY" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith("seb", {
        name: "Emergency",
        provider: "SEB",
        currency: "SEK",
        interestRate: { value: 0.3, period: "MONTHLY" },
      })
    );

    fireEvent.click(screen.getByRole("button", { name: "Actions for Savings" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Archive" }));
    await waitFor(() => expect(remove).toHaveBeenCalledWith("seb"));
  });

  it("clears the rate with null when the field is emptied", async () => {
    render(<AccountsSettings />);
    fireEvent.click(screen.getByRole("tab", { name: "Savings" }));
    fireEvent.click(screen.getByRole("button", { name: "Actions for Savings" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    fireEvent.change(screen.getByLabelText("Interest rate %"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(update).toHaveBeenCalledWith("seb", expect.objectContaining({ interestRate: null }))
    );
  });
});
