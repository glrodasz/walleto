import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CategoriesSettings } from "./CategoriesSettings";

const create = jest.fn().mockResolvedValue("new1");
const rename = jest.fn().mockResolvedValue(undefined);
const remove = jest.fn().mockResolvedValue(undefined);
const update = jest.fn().mockResolvedValue(undefined);
let lastDomain = "";
jest.mock("../../../hooks/useCategories", () => ({
  useCategories: (domain: string) => {
    lastDomain = domain;
    return {
      categories:
        domain === "EXPENSE"
          ? [
              { id: "e1", domain, name: "Groceries", isDefault: true },
              { id: "e2", domain, name: "Rent" },
              { id: "sub", domain, name: "Bread", parentId: "e1" },
            ]
          : [{ id: "i1", domain, name: "Salary" }],
      loading: false,
      error: null,
      create,
      rename,
      remove,
      update,
    };
  },
}));

beforeEach(() => {
  create.mockClear();
  rename.mockClear();
  remove.mockClear();
  update.mockClear();
});

describe("CategoriesSettings", () => {
  it("lists root categories of the selected domain and switches domains", () => {
    render(<CategoriesSettings />);
    expect(lastDomain).toBe("EXPENSE");
    expect(screen.getByText("Groceries")).toBeInTheDocument();
    expect(screen.getByText("Rent")).toBeInTheDocument();
    expect(screen.queryByText("Bread")).toBeNull();

    fireEvent.click(screen.getByRole("tab", { name: "Incomes" }));
    expect(screen.getByText("Salary")).toBeInTheDocument();
  });

  it("renames through the edit modal, archives through the kebab, and adds through the combobox", async () => {
    render(<CategoriesSettings />);

    fireEvent.click(screen.getByRole("button", { name: "Actions for Rent" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    const input = screen.getByLabelText("Name");
    fireEvent.change(input, { target: { value: "Housing" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(rename).toHaveBeenCalledWith("e2", "Housing"));

    fireEvent.click(screen.getByRole("button", { name: "Actions for Groceries" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Archive" }));
    await waitFor(() => expect(remove).toHaveBeenCalledWith("e1"));

    fireEvent.click(screen.getByRole("button", { name: /Add category/ }));
    const box = screen.getByRole("combobox");
    fireEvent.change(box, { target: { value: "Travel" } });
    fireEvent.keyDown(box, { key: "Enter" });
    await waitFor(() => expect(create).toHaveBeenCalledWith({ domain: "EXPENSE", name: "Travel" }));
  });

  it("changes a category's icon from the edit modal", async () => {
    render(<CategoriesSettings />);
    fireEvent.click(screen.getByRole("button", { name: "Actions for Rent" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    fireEvent.click(screen.getByRole("radio", { name: "plane" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(update).toHaveBeenCalledWith("e2", { icon: "plane" }));
  });
});
