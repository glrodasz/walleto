import { fireEvent, render, screen } from "@testing-library/react";
import { Modal } from "./Modal";
import { Combobox } from "../atoms/Combobox";

describe("Modal", () => {
  afterEach(() => {
    document.body.style.overflow = "";
  });

  it("renders nothing while closed", () => {
    render(
      <Modal open={false} title="Hidden" onClose={jest.fn()}>
        <p>content</p>
      </Modal>
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders the title as the dialog label and closes on Escape and overlay click", () => {
    const onClose = jest.fn();
    render(
      <Modal open title="Record a payment" onClose={onClose}>
        <p>content</p>
      </Modal>
    );
    const dialog = screen.getByRole("dialog", { name: "Record a payment" });
    expect(dialog).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(dialog);
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(dialog.parentElement as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it("locks body scroll while open and restores it on close", () => {
    document.body.style.overflow = "auto";
    const { rerender } = render(
      <Modal open title="Sheet" onClose={jest.fn()}>
        <p>content</p>
      </Modal>
    );
    expect(document.body.style.overflow).toBe("hidden");

    rerender(
      <Modal open={false} title="Sheet" onClose={jest.fn()}>
        <p>content</p>
      </Modal>
    );
    expect(document.body.style.overflow).toBe("auto");
  });
  it("does not close when a suggestion is picked from a combobox inside it", () => {
    const onClose = jest.fn();
    const onSelect = jest.fn();
    render(
      <Modal open title="Edit method" onClose={onClose}>
        <Combobox label="Network" suggestions={["Visa", "Mastercard"]} onSelect={onSelect} />
      </Modal>
    );
    const overlay = screen.getByRole("dialog").parentElement as HTMLElement;

    // Committing on mousedown tears the option out of the DOM before mouseup,
    // so the browser has nothing to fire the click at and retargets it to
    // whatever is now under the pointer — very often the scrim.
    fireEvent.mouseDown(screen.getByRole("option", { name: "Visa" }));
    expect(onSelect).toHaveBeenCalledWith("Visa");

    fireEvent.click(overlay);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("keeps the dialog open when a press starts inside it but still closes on a real scrim press", () => {
    const onClose = jest.fn();
    render(
      <Modal open title="Sheet" onClose={onClose}>
        <p>content</p>
      </Modal>
    );
    const overlay = screen.getByRole("dialog").parentElement as HTMLElement;

    fireEvent.mouseDown(screen.getByText("content"));
    fireEvent.click(overlay);
    expect(onClose).not.toHaveBeenCalled();

    // A press that genuinely begins on the scrim must still dismiss.
    fireEvent.mouseDown(overlay);
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
