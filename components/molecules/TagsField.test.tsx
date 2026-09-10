import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TagsField } from "./TagsField";
import type { Tag } from "../../types";

const tags = [
  { id: "trip", userId: "u", name: "Trip2026", key: "trip2026" },
  { id: "work", userId: "u", name: "Work", key: "work" },
] as Tag[];

function setup(value: string[] = ["work"], createTag = jest.fn().mockResolvedValue("new1")) {
  const onChange = jest.fn();
  const onError = jest.fn();
  render(
    <TagsField
      tags={tags}
      value={value}
      onChange={onChange}
      createTag={createTag}
      onError={onError}
    />
  );
  return { onChange, onError, createTag };
}

describe("TagsField", () => {
  it("shows selected tags as chips and removes one", () => {
    const { onChange } = setup();
    expect(screen.getByText("Work")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Remove Work" }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("picks an existing tag from the suggestions without creating", async () => {
    const { onChange, createTag } = setup();
    fireEvent.click(screen.getByRole("button", { name: /Add tag/ }));
    const box = screen.getByRole("combobox");
    fireEvent.change(box, { target: { value: "trip" } });
    fireEvent.keyDown(box, { key: "Enter" });
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(["work", "trip"]));
    expect(createTag).not.toHaveBeenCalled();
  });

  it("reuses a tag whose key matches a differently spelled name", async () => {
    const { onChange, createTag } = setup([]);
    fireEvent.click(screen.getByRole("button", { name: /Add tag/ }));
    const box = screen.getByRole("combobox");
    fireEvent.change(box, { target: { value: "trip 2026" } });
    fireEvent.keyDown(box, { key: "Enter" });
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(["trip"]));
    expect(createTag).not.toHaveBeenCalled();
  });

  it("creates an unknown tag and appends its id", async () => {
    const { onChange, createTag } = setup();
    fireEvent.click(screen.getByRole("button", { name: /Add tag/ }));
    const box = screen.getByRole("combobox");
    fireEvent.change(box, { target: { value: "Beach" } });
    fireEvent.keyDown(box, { key: "Enter" });
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(["work", "new1"]));
    expect(createTag).toHaveBeenCalledWith("Beach");
  });

  it("reports a failed creation", async () => {
    const { onChange, onError } = setup([], jest.fn().mockRejectedValue(new Error("409")));
    jest.spyOn(console, "error").mockImplementation(() => {});
    fireEvent.click(screen.getByRole("button", { name: /Add tag/ }));
    const box = screen.getByRole("combobox");
    fireEvent.change(box, { target: { value: "Beach" } });
    fireEvent.keyDown(box, { key: "Enter" });
    await waitFor(() => expect(onError).toHaveBeenCalledWith('Couldn\'t create the tag "Beach"'));
    expect(onChange).not.toHaveBeenCalled();
  });
});
