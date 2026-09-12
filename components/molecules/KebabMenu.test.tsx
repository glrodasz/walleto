import { fireEvent, render, screen } from "@testing-library/react";
import { KebabMenu } from "./KebabMenu";

const actions = [
  { label: "Edit", onSelect: jest.fn() },
  { label: "Delete", onSelect: jest.fn(), danger: true },
];

describe("KebabMenu", () => {
  beforeEach(() => actions.forEach((a) => a.onSelect.mockClear()));

  it("opens and closes on the trigger", () => {
    render(<KebabMenu aria-label="Actions for Bread" actions={actions} />);
    const trigger = screen.getByRole("button", { name: "Actions for Bread" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menuitem", { name: "Edit" })).toBeInTheDocument();

    fireEvent.click(trigger);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("runs an action and closes", () => {
    render(<KebabMenu actions={actions} />);
    fireEvent.click(screen.getByRole("button", { name: "More options" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    expect(actions[1].onSelect).toHaveBeenCalled();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes on Escape and on a click outside", () => {
    render(<KebabMenu actions={actions} />);
    const trigger = screen.getByRole("button", { name: "More options" });

    fireEvent.click(trigger);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    fireEvent.click(trigger);
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("stays open when the click lands inside the menu", () => {
    render(<KebabMenu actions={actions} />);
    fireEvent.click(screen.getByRole("button", { name: "More options" }));
    fireEvent.mouseDown(screen.getByRole("menu"));
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("mounts the menu on the body, not inside the row", () => {
    // The regression this component exists to avoid: a glass Card (backdrop-filter)
    // is a stacking context and a containing block, and a dimmed row is another —
    // a menu rendered inside either one is painted under whatever comes after it.
    render(
      <ul>
        <li style={{ opacity: 0.55 }} data-testid="row">
          <KebabMenu actions={actions} />
        </li>
      </ul>
    );
    fireEvent.click(screen.getByRole("button", { name: "More options" }));
    const menu = screen.getByRole("menu");
    expect(menu.parentElement).toBe(document.body);
    expect(screen.getByTestId("row")).not.toContainElement(menu);
  });
});
