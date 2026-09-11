import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TagsSettings } from "./TagsSettings";

const create = jest.fn().mockResolvedValue("new1");
const update = jest.fn().mockResolvedValue(undefined);
const remove = jest.fn().mockResolvedValue(undefined);
let tags: unknown[] = [];
jest.mock("../../../hooks/useTags", () => ({
  useTags: () => ({
    tags,
    loading: false,
    error: null,
    create,
    update,
    remove,
  }),
}));

beforeEach(() => {
  tags = [
    { id: "trip", userId: "u", name: "Trip2026", key: "trip2026" },
    { id: "work", userId: "u", name: "Work", key: "work" },
  ];
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

describe("TagsSettings — paging", () => {
  it("shows 25 rows per page and moves to the rest", () => {
    tags = Array.from({ length: 30 }, (_, i) => ({
      id: `t${i}`,
      userId: "u",
      name: `Tag${String(i).padStart(2, "0")}`,
      key: `tag${i}`,
    }));
    render(<TagsSettings />);
    expect(screen.getByText("Tag00")).toBeInTheDocument();
    expect(screen.queryByText("Tag25")).toBeNull();
    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Tag25")).toBeInTheDocument();
    expect(screen.queryByText("Tag00")).toBeNull();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });
});
