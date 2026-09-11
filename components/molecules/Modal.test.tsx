import { fireEvent, render, screen } from "@testing-library/react";
import { Modal } from "./Modal";

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
});
