import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CategoryField } from "./CategoryField";
import type { Category } from "../../types";

const categories = [
  { id: "g1", userId: "u", domain: "EXPENSE", name: "Groceries", archived: false },
  { id: "sub", userId: "u", domain: "EXPENSE", name: "Bread", archived: false, parentId: "g1" },
] as unknown as Category[];

function setup(createCategory = jest.fn().mockResolvedValue("new1")) {
  const onChange = jest.fn();
  const onError = jest.fn();
  render(
    <CategoryField
      categories={categories}
      value=""
      onChange={onChange}
      createCategory={createCategory}
      newLabel="New expense category"
      onError={onError}
    />
  );
  return { onChange, onError, createCategory };
}

describe("CategoryField", () => {
  it("offers only root categories", () => {
    setup();
    const select = screen.getByLabelText("Category") as HTMLSelectElement;
    const labels = Array.from(select.options).map((o) => o.textContent);
    expect(labels).toContain("Groceries");
    expect(labels).not.toContain("Bread");
  });

  it("selects an existing category by name instead of creating a duplicate", async () => {
    const { onChange, createCategory } = setup();
    fireEvent.click(screen.getByRole("button", { name: /New category/ }));
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "groceries" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => expect(onChange).toHaveBeenCalledWith("g1"));
    expect(createCategory).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Category")).toBeInTheDocument();
  });

  it("creates a new category and selects the returned id", async () => {
    const { onChange, createCategory } = setup();
    fireEvent.click(screen.getByRole("button", { name: /New category/ }));
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "Travel" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => expect(onChange).toHaveBeenCalledWith("new1"));
    expect(createCategory).toHaveBeenCalledWith("Travel");
  });

  it("reports a failed creation without selecting anything", async () => {
    const { onChange, onError } = setup(jest.fn().mockRejectedValue(new Error("409")));
    jest.spyOn(console, "error").mockImplementation(() => {});
    fireEvent.click(screen.getByRole("button", { name: /New category/ }));
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "Travel" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith('Couldn\'t create the category "Travel"')
    );
    expect(onChange).not.toHaveBeenCalled();
  });
});
