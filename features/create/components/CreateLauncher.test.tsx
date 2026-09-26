import { fireEvent, render, screen } from "@testing-library/react";
import { CreateLauncher } from "./CreateLauncher";

jest.mock("../../investments/components/RecordValueModal", () => ({
  RecordValueModal: () => <div data-testid="value" />,
}));
jest.mock("../../domains/components/RecurrentTransactionModal", () => ({
  RecurrentTransactionModal: ({
    domain,
    open,
    initialFrequency,
  }: {
    domain: string;
    open: boolean;
    initialFrequency?: string;
  }) =>
    open ? (
      <div data-testid={initialFrequency === "ONE_TIME" ? "quick" : "recurring"}>{domain}</div>
    ) : null,
}));

describe("CreateLauncher", () => {
  it("opens a sheet fixed to the page's domain and mounts the quick form on choice", async () => {
    render(<CreateLauncher domain="EXPENSE" />);
    expect(screen.queryByTestId("quick")).toBeNull();
    expect(screen.queryByTestId("recurring")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    const sheet = screen.getByRole("dialog", { name: "Add" });
    expect(sheet).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Type" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Log a one-off expense/ }));
    expect(screen.queryByRole("dialog", { name: "Add" })).toBeNull();
    // The forms are code-split, so they land a tick after the choice.
    expect(await screen.findByTestId("quick")).toHaveTextContent("EXPENSE");
  });

  it("lets pages without a domain pick one, then opens the recurring form for it", async () => {
    render(<CreateLauncher />);
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getByRole("group", { name: "Type" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add expense to your plan/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Income" }));
    fireEvent.click(screen.getByRole("button", { name: /Add income to your plan/ }));
    expect(await screen.findByTestId("recurring")).toHaveTextContent("INCOME");
    expect(screen.queryByTestId("quick")).toBeNull();
  });

  it("offers the plan before a one-off", () => {
    render(<CreateLauncher domain="EXPENSE" />);
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    const options = screen
      .getAllByRole("button")
      .map((b) => b.textContent ?? "")
      .filter((t) => /to your plan|one-off/.test(t));
    expect(options[0]).toMatch(/Add expense to your plan/);
    expect(options[1]).toMatch(/Log a one-off expense/);
  });
});
