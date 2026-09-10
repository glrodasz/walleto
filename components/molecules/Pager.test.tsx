import { fireEvent, render, screen } from "@testing-library/react";
import { Pager } from "./Pager";

describe("Pager", () => {
  it("renders nothing for one page", () => {
    const { container } = render(<Pager page={1} pageCount={1} onChange={jest.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("moves between pages and disables the edges", () => {
    const onChange = jest.fn();
    render(<Pager page={1} pageCount={3} onChange={onChange} />);
    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(onChange).toHaveBeenCalledWith(2);
  });
});
