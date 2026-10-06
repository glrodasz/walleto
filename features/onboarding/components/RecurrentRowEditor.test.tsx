import { fireEvent, render, screen, within } from "@testing-library/react";
import { CURRENCIES } from "../../../constants";
import { currencyOptions } from "../../../helpers/currencies";
import { CADENCE_SECTIONS } from "../helpers/cadenceSections";
import type { RecurrentRow } from "../hooks/useRecurrentStep";

const mockOptions = currencyOptions([...CURRENCIES]);

jest.mock("../../../hooks/useEnabledCurrencies", () => ({
  useEnabledCurrencies: () => ({ optionsFor: () => mockOptions }),
}));

import { RecurrentRowEditor } from "./RecurrentRowEditor";

const row: RecurrentRow = {
  key: "r1",
  id: "saved-1",
  categoryId: "c1",
  name: "Rent",
  amount: "1650",
  currency: "USD",
  frequency: "MONTHLY",
  paymentMethodId: "",
  dayOfMonth: 1,
  secondDayOfMonth: 15,
  month: 0,
  date: "",
};

const renderRow = (onRemove = jest.fn()) =>
  render(
    <RecurrentRowEditor
      row={row}
      section={CADENCE_SECTIONS[0]}
      categoryOptions={[{ value: "c1", label: "Home" }]}
      methodOptions={[]}
      onChange={jest.fn()}
      onRemove={onRemove}
    />
  );

describe("RecurrentRowEditor", () => {
  it("removes from a footer under the fields, never an × beside them", () => {
    const onRemove = jest.fn();
    const { container } = renderRow(onRemove);

    const footer = container.querySelector(".editor-footer") as HTMLElement;
    const remove = within(footer).getByRole("button", { name: "Remove Rent" });
    expect(remove).toHaveTextContent("Remove");
    // The only remove control is that one, and it comes after every field.
    expect(screen.getAllByRole("button", { name: /^Remove/ })).toEqual([remove]);
    const fields = container.querySelector(".fields") as HTMLElement;
    expect(fields.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    fireEvent.click(remove);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("has no Done: the row is always open", () => {
    renderRow();
    expect(screen.queryByRole("button", { name: "Done" })).not.toBeInTheDocument();
  });
});
