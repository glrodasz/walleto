import { fireEvent, render, screen, within } from "@testing-library/react";
import { ListItem, ListItems } from "./ListItem";

describe("ListItem", () => {
  it("renders the name, meta and amount", () => {
    render(
      <ListItems>
        <ListItem name="Groceries" meta="Sep 1 · Monthly · Visa" amount="$120.00" />
      </ListItems>
    );
    const row = screen.getByRole("listitem");
    expect(within(row).getByText("Groceries")).toBeInTheDocument();
    expect(within(row).getByText("Sep 1 · Monthly · Visa")).toBeInTheDocument();
    expect(within(row).getByText("$120.00")).toBeInTheDocument();
  });

  it("makes the row a button that keeps the amount inside it, with the trailing slot outside", () => {
    const onClick = jest.fn();
    render(
      <ListItems>
        <ListItem
          name="Household"
          amount="$2,800.00"
          onClick={onClick}
          trailing={<button type="button">More</button>}
        />
      </ListItems>
    );
    const hit = screen.getByRole("button", { name: /Household/ });
    expect(within(hit).getByText("$2,800.00")).toBeInTheDocument();
    expect(within(hit).queryByText("More")).not.toBeInTheDocument();
    fireEvent.click(hit);
    expect(onClick).toHaveBeenCalled();
  });

  it("is a plain row when it leads nowhere", () => {
    render(
      <ListItems>
        <ListItem name="Salary" amount="$0.00" />
      </ListItems>
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("links out when given an href", () => {
    render(
      <ListItems>
        <ListItem name="Food" href="/expenses" />
      </ListItems>
    );
    expect(screen.getByRole("link", { name: /Food/ })).toHaveAttribute("href", "/expenses");
  });

  it("puts the badges on their own line under the facts, not beside the name", () => {
    render(
      <ListItems>
        <ListItem name="iCloud" meta="Sep 12 · Monthly · Subscriptions" badges={<em>Family</em>} />
      </ListItems>
    );
    const meta = screen.getByText("Sep 12 · Monthly · Subscriptions");
    const badge = screen.getByText("Family");
    // DOCUMENT_POSITION_FOLLOWING: the badge comes after the meta line.
    expect(meta.compareDocumentPosition(badge) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("renders badges and a labelled progress bar when asked", () => {
    render(
      <ListItems>
        <ListItem
          name="Freelance"
          badges={<span>Hidden on chart</span>}
          progress={{ ratio: 0.7, color: "var(--accent)", label: "Freelance share" }}
        />
      </ListItems>
    );
    expect(screen.getByText("Hidden on chart")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Freelance share" })).toHaveAttribute(
      "aria-valuenow",
      "70"
    );
  });
});
