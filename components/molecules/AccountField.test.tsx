import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AccountField } from "./AccountField";
import type { Account } from "../../types";

const accounts = [
  { id: "a1", userId: "u", domain: "SAVING", name: "Emergency fund", currency: "USD" },
  { id: "a2", userId: "u", domain: "SAVING", name: "Trip", currency: "EUR" },
] as Account[];

function setup(
  createAccount = jest.fn().mockResolvedValue("new1"),
  domain: "SAVING" | "INVESTMENT" = "SAVING"
) {
  const onChange = jest.fn();
  const onError = jest.fn();
  render(
    <AccountField
      domain={domain}
      accounts={accounts}
      value=""
      onChange={onChange}
      createAccount={createAccount}
      defaultCurrency="USD"
      onError={onError}
    />
  );
  return { onChange, onError, createAccount };
}

describe("AccountField", () => {
  it("offers 'No pocket' plus the domain's accounts", () => {
    const { onChange } = setup();
    const select = screen.getByLabelText("Pocket") as HTMLSelectElement;
    expect(Array.from(select.options).map((o) => o.textContent)).toEqual([
      "No pocket",
      "Emergency fund",
      "Trip",
    ]);
    fireEvent.change(select, { target: { value: "a2" } });
    expect(onChange).toHaveBeenCalledWith("a2");
  });

  it("calls investments accounts", () => {
    setup(undefined, "INVESTMENT");
    expect(screen.getByLabelText("Account")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /New account/ })).toBeInTheDocument();
  });

  it("creates a pocket with an interest rate and selects it", async () => {
    const { onChange, createAccount } = setup();
    fireEvent.click(screen.getByRole("button", { name: /New pocket/ }));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "SEB savings" } });
    fireEvent.change(screen.getByLabelText("Bank or broker (optional)"), {
      target: { value: "SEB" },
    });
    fireEvent.change(screen.getByLabelText("Currency"), { target: { value: "SEK" } });
    fireEvent.change(screen.getByLabelText("Interest rate % (optional)"), {
      target: { value: "2.5" },
    });
    fireEvent.change(screen.getByLabelText("Rate period"), { target: { value: "YEARLY" } });
    fireEvent.click(screen.getByRole("button", { name: "Add pocket" }));

    await waitFor(() => expect(onChange).toHaveBeenCalledWith("new1"));
    expect(createAccount).toHaveBeenCalledWith({
      domain: "SAVING",
      name: "SEB savings",
      currency: "SEK",
      provider: "SEB",
      interestRate: { value: 2.5, period: "YEARLY" },
    });
    // Back to the select once created.
    expect(screen.getByLabelText("Pocket")).toBeInTheDocument();
  });

  it("selects an existing pocket by name instead of creating a duplicate", async () => {
    const { onChange, createAccount } = setup();
    fireEvent.click(screen.getByRole("button", { name: /New pocket/ }));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "trip" } });
    fireEvent.click(screen.getByRole("button", { name: "Add pocket" }));

    await waitFor(() => expect(onChange).toHaveBeenCalledWith("a2"));
    expect(createAccount).not.toHaveBeenCalled();
  });

  it("reports a failed creation without selecting anything", async () => {
    const { onChange, onError } = setup(jest.fn().mockRejectedValue(new Error("409")));
    jest.spyOn(console, "error").mockImplementation(() => {});
    fireEvent.click(screen.getByRole("button", { name: /New pocket/ }));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Broken" } });
    fireEvent.click(screen.getByRole("button", { name: "Add pocket" }));

    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith('Couldn\'t create the pocket "Broken"')
    );
    expect(onChange).not.toHaveBeenCalled();
  });

  it("rejects an out-of-range rate before calling the API", () => {
    const { onError, createAccount } = setup();
    fireEvent.click(screen.getByRole("button", { name: /New pocket/ }));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Odd" } });
    fireEvent.change(screen.getByLabelText("Interest rate % (optional)"), {
      target: { value: "250" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add pocket" }));
    expect(onError).toHaveBeenCalledWith("Interest rate must be between 0 and 100");
    expect(createAccount).not.toHaveBeenCalled();
  });
});
