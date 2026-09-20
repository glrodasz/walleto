import { fireEvent, render, screen } from "@testing-library/react";
import { DeleteAccountModal } from "./DeleteAccountModal";

const deleteAccount = jest.fn();
let hookState = { deleteAccount, deleting: false, error: null as string | null };

jest.mock("../hooks/useDeleteAccount", () => ({
  useDeleteAccount: () => hookState,
}));

beforeEach(() => {
  deleteAccount.mockReset();
  hookState = { deleteAccount, deleting: false, error: null };
});

afterEach(() => {
  document.body.style.overflow = "";
});

describe("DeleteAccountModal", () => {
  it("only arms the button once DELETE is typed", () => {
    render(<DeleteAccountModal open onClose={jest.fn()} />);
    const button = screen.getByRole("button", { name: "Delete everything" });
    expect(button).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Type DELETE to confirm"), {
      target: { value: "delete" },
    });
    expect(button).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Type DELETE to confirm"), {
      target: { value: "DELETE" },
    });
    expect(button).toBeEnabled();
    fireEvent.click(button);
    expect(deleteAccount).toHaveBeenCalledTimes(1);
  });

  it("shows the hook's error and cannot be closed while deleting", () => {
    hookState = { deleteAccount, deleting: true, error: "Couldn't delete the account" };
    const onClose = jest.fn();
    render(<DeleteAccountModal open onClose={onClose} />);
    expect(screen.getByText("Couldn't delete the account")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Deleting…" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).not.toHaveBeenCalled();
  });
});
