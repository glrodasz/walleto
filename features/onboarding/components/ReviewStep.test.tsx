import { fireEvent, render, screen, within } from "@testing-library/react";
import { ReviewStep } from "./ReviewStep";
import { computeFlow } from "../../../helpers/aggregations";
import { IDENTITY_RATES } from "../../../helpers/fx";
import type { useReviewStep } from "../hooks/useReviewStep";
import type { Category, RecurrentTransaction } from "../../../types";

const ctx = { rates: IDENTITY_RATES, target: "USD" as const };
const item = (id: string, name: string, amount: number, frequency = "MONTHLY") =>
  ({ id, name, amount, frequency, currency: "USD", categoryId: "c1" }) as RecurrentTransaction;
const category = (domain: "INCOME" | "EXPENSE") =>
  ({ id: "c1", name: domain === "INCOME" ? "Salary" : "Housing", domain }) as Category;

const state = (
  income: RecurrentTransaction[],
  expense: RecurrentTransaction[]
): ReturnType<typeof useReviewStep> => ({
  loading: false,
  error: null,
  flow: computeFlow({ INCOME: income, EXPENSE: expense }, ctx),
  ctx,
  currency: "USD",
  approximate: false,
  groups: [
    {
      domain: "INCOME",
      title: "Income in your plan",
      href: "/onboarding/incomes",
      items: income,
      categories: [category("INCOME")],
    },
    {
      domain: "EXPENSE",
      title: "Expenses in your plan",
      href: "/onboarding/expenses",
      items: expense,
      categories: [category("EXPENSE")],
    },
  ],
});

describe("ReviewStep", () => {
  it("shows the plan's verdict and every item, with the monthly share of a yearly one", () => {
    render(
      <ReviewStep
        state={state(
          [item("i1", "Salary", 3000)],
          [item("e1", "Rent", 1000), item("e2", "Insurance", 1200, "YEARLY")]
        )}
        onEdit={jest.fn()}
      />
    );

    expect(screen.getByText("On plan")).toBeInTheDocument();
    expect(screen.getByText("Rent")).toBeInTheDocument();
    expect(screen.getByText("Yearly · Housing")).toBeInTheDocument();
    expect(screen.getByText("≈ $100.00 / month")).toBeInTheDocument();
  });

  it("says when expenses outrun income", () => {
    render(<ReviewStep state={state([], [item("e1", "Rent", 1000)])} onEdit={jest.fn()} />);
    expect(screen.getByText("Over-committed")).toBeInTheDocument();
    expect(screen.getByText("No income in your plan yet.")).toBeInTheDocument();
  });

  it("goes back to the step that edits a group", () => {
    const onEdit = jest.fn();
    render(<ReviewStep state={state([item("i1", "Salary", 3000)], [])} onEdit={onEdit} />);

    const expenses = screen.getByRole("heading", { name: "Expenses in your plan" }).parentElement!
      .parentElement as HTMLElement;
    fireEvent.click(within(expenses).getByRole("button", { name: "Edit" }));
    expect(onEdit).toHaveBeenCalledWith("/onboarding/expenses");
  });
});
