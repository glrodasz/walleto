import { fireEvent, render, screen } from "@testing-library/react";
import { CreateLauncher } from "./CreateLauncher";

jest.mock("../../transactions/components/QuickTransactionModal", () => ({
  QUICK_COPY: {
    EXPENSE: { title: "Record a payment" },
    INCOME: { title: "Record an income" },
    INVESTMENT: { title: "Record a contribution" },
    SAVING: { title: "Record a deposit" },
  },
  QuickTransactionModal: ({ domain, open }: { domain: string; open: boolean }) =>
    open ? <div data-testid="quick">{domain}</div> : null,
}));
jest.mock("../../investments/components/RecordValueModal", () => ({
  RecordValueModal: () => <div data-testid="value" />,
}));
jest.mock("../../domains/components/RecurrentTransactionModal", () => ({
  RecurrentTransactionModal: ({ domain, open }: { domain: string; open: boolean }) =>
    open ? <div data-testid="recurring">{domain}</div> : null,
}));

describe("CreateLauncher", () => {
  it("opens a sheet fixed to the page's domain and mounts the quick form on choice", () => {
    render(<CreateLauncher domain="EXPENSE" />);
    expect(screen.queryByTestId("quick")).toBeNull();
    expect(screen.queryByTestId("recurring")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    const sheet = screen.getByRole("dialog", { name: "Add" });
    expect(sheet).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Type" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Record a payment/ }));
    expect(screen.queryByRole("dialog", { name: "Add" })).toBeNull();
    expect(screen.getByTestId("quick")).toHaveTextContent("EXPENSE");
  });

  it("lets pages without a domain pick one, then opens the recurring form for it", () => {
    render(<CreateLauncher />);
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getByRole("group", { name: "Type" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add a recurring expense/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Income" }));
    fireEvent.click(screen.getByRole("button", { name: /Add a recurring income/ }));
    expect(screen.getByTestId("recurring")).toHaveTextContent("INCOME");
    expect(screen.queryByTestId("quick")).toBeNull();
  });
});
