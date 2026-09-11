import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PreferencesCard } from "./PreferencesCard";

const update = jest.fn().mockResolvedValue(undefined);
const setPreference = jest.fn().mockResolvedValue(undefined);

jest.mock("../../../hooks/useUserDoc", () => ({
  useUserDoc: () => ({ userDoc: { mainCurrency: "USD" }, update }),
}));
jest.mock("../../../hooks/useTheme", () => ({
  useTheme: () => ({ preference: "system", resolved: "light", setPreference }),
}));

beforeEach(() => {
  update.mockClear();
  setPreference.mockClear();
});

describe("PreferencesCard", () => {
  it("saves the date format, week start and language on the user doc", async () => {
    render(<PreferencesCard />);
    fireEvent.change(screen.getByRole("combobox", { name: "Date format" }), {
      target: { value: "YMD" },
    });
    await waitFor(() => expect(update).toHaveBeenCalledWith({ dateFormat: "YMD" }));

    fireEvent.change(screen.getByRole("combobox", { name: "Start week on" }), {
      target: { value: "0" },
    });
    await waitFor(() => expect(update).toHaveBeenCalledWith({ weekStart: 0 }));

    expect(screen.getByRole("combobox", { name: "Language" })).toHaveValue("en");
  });

  it("switches the theme through the segmented control", () => {
    render(<PreferencesCard />);
    expect(screen.getByRole("radio", { name: "System" })).toHaveAttribute("aria-checked", "true");
    fireEvent.click(screen.getByRole("radio", { name: "Dark" }));
    expect(setPreference).toHaveBeenCalledWith("dark");
  });
});
