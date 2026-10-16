import { fireEvent, render, screen } from "@testing-library/react";
import { Pager } from "./Pager";
import { DEFAULT_PREFERENCES, PreferencesContext } from "../../hooks/usePreferences";

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

  it("speaks Spanish inside a Spanish preference", () => {
    render(
      <PreferencesContext.Provider value={{ ...DEFAULT_PREFERENCES, language: "es" }}>
        <Pager page={2} pageCount={5} onChange={jest.fn()} />
      </PreferencesContext.Provider>
    );
    expect(screen.getByText("Página 2 de 5")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Anterior" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeInTheDocument();
  });
});
