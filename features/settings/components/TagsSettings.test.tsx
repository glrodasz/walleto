import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TagsSettings } from "./TagsSettings";

const create = jest.fn().mockResolvedValue("new1");
const update = jest.fn().mockResolvedValue(undefined);
const remove = jest.fn().mockResolvedValue(undefined);
jest.mock("../../../hooks/useTags", () => ({
  useTags: () => ({
    tags: [
      { id: "trip", userId: "u", name: "Trip2026", key: "trip2026" },
      { id: "work", userId: "u", name: "Work", key: "work" },
    ],
    loading: false,
    error: null,
    create,
    update,
    remove,
  }),
}));

beforeEach(() => {
  create.mockClear();
  update.mockClear();
  remove.mockClear();
});

describe("TagsSettings", () => {
  it("lists, renames, archives and adds", async () => {
    render(<TagsSettings />);
    expect(screen.getByText("Trip2026")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Actions for Work" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Rename" }));
    fireEvent.change(screen.getByLabelText("Tag name"), { target: { value: "Office" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(update).toHaveBeenCalledWith("work", { name: "Office" }));

    fireEvent.click(screen.getByRole("button", { name: "Actions for Trip2026" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Archive" }));
    await waitFor(() => expect(remove).toHaveBeenCalledWith("trip"));

    fireEvent.click(screen.getByRole("button", { name: /Add tag/ }));
    const box = screen.getByRole("combobox");
    fireEvent.change(box, { target: { value: "Beach" } });
    fireEvent.keyDown(box, { key: "Enter" });
    await waitFor(() => expect(create).toHaveBeenCalledWith("Beach"));
  });

  it("refuses a rename that collides with another tag's key", async () => {
    render(<TagsSettings />);
    fireEvent.click(screen.getByRole("button", { name: "Actions for Work" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Rename" }));
    fireEvent.change(screen.getByLabelText("Tag name"), { target: { value: "trip 2026" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      'You already have a tag called "Trip2026"'
    );
    expect(update).not.toHaveBeenCalled();
  });
});
