import { fireEvent, render, screen } from "@testing-library/react";
import { EditorFooter } from "./EditorFooter";

describe("EditorFooter", () => {
  it("puts Remove before Done, both in the one right-aligned row", () => {
    const onRemove = jest.fn();
    const onDone = jest.fn();
    render(<EditorFooter onRemove={onRemove} removeLabel="Remove Rent" onDone={onDone} />);

    const remove = screen.getByRole("button", { name: "Remove Rent" });
    const done = screen.getByRole("button", { name: "Done" });
    expect(remove.compareDocumentPosition(done) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(remove.parentElement).toBe(done.parentElement);

    fireEvent.click(remove);
    fireEvent.click(done);
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("shows Remove as a danger button with its icon and the word, never a bare ×", () => {
    render(<EditorFooter onRemove={() => {}} removeLabel="Remove Rent" />);
    const remove = screen.getByRole("button", { name: "Remove Rent" });
    expect(remove).toHaveClass("btn--danger");
    expect(remove).toHaveTextContent("Remove");
    expect(remove.querySelector("svg")).not.toBeNull();
  });

  it("leaves out whichever action has no handler", () => {
    const { rerender } = render(<EditorFooter onDone={() => {}} />);
    expect(screen.queryByRole("button", { name: /Remove/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument();

    rerender(<EditorFooter onRemove={() => {}} removeLabel="Remove row" />);
    expect(screen.getByRole("button", { name: "Remove row" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Done" })).not.toBeInTheDocument();
  });
});
