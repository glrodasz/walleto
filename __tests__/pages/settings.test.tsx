import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import SettingsPage from "../../pages/settings";

const pushMock = jest.fn();
const updateMock = jest.fn();

jest.mock("next/router", () => ({
  useRouter: () => ({ push: pushMock }),
}));

jest.mock("../../lib/auth0", () => ({
  __esModule: true,
  default: {
    withPageAuthRequired: () => undefined,
  },
}));

jest.mock("@auth0/nextjs-auth0/client", () => ({
  useUser: () => ({ user: { name: "Ada Lovelace", email: "ada@example.com" } }),
}));

jest.mock("../../hooks/useMoneyContext", () => ({
  useMoneyContext: () => ({ target: "USD", setDisplayCurrency: jest.fn() }),
}));

jest.mock("../../hooks/useUserDoc", () => ({
  useUserDoc: () => ({ userDoc: { onboardingCompleted: true }, update: updateMock }),
}));

// The app shell mounts the mobile create launcher, whose forms reach the
// Firebase client; this page test is about Settings, not about creating.
jest.mock("../../features/settings/components/CategoriesSettings", () => ({
  CategoriesSettings: () => null,
}));
jest.mock("../../features/settings/components/AccountsSettings", () => ({
  AccountsSettings: () => null,
}));
jest.mock("../../features/settings/components/TagsSettings", () => ({
  TagsSettings: () => <div data-testid="tags-settings" />,
}));
jest.mock("../../features/settings/components/MethodsSettings", () => ({
  MethodsSettings: () => <div data-testid="methods-settings" />,
}));

jest.mock("../../features/create/components/CreateLauncher", () => ({
  CreateLauncher: () => null,
}));

const fetchMock = jest.fn();
global.fetch = fetchMock as unknown as typeof fetch;

beforeEach(() => {
  pushMock.mockReset();
  updateMock.mockReset();
  fetchMock.mockReset().mockResolvedValue({ ok: true, json: async () => ({ created: 0 }) });
});

describe("SettingsPage", () => {
  it("opens on General and switches sections through the strip, keeping the hash", () => {
    render(<SettingsPage />);
    const main = screen.getByRole("main");
    expect(screen.getByRole("tab", { name: "General" })).toHaveAttribute("aria-selected", "true");
    expect(within(main).getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.queryByTestId("tags-settings")).toBeNull();

    fireEvent.click(screen.getByRole("tab", { name: "Tags" }));
    expect(screen.getByTestId("tags-settings")).toBeInTheDocument();
    expect(within(main).queryByText("Ada Lovelace")).toBeNull();
    expect(window.location.hash).toBe("#tags");

    fireEvent.click(screen.getByRole("tab", { name: "General" }));
    expect(window.location.hash).toBe("");
  });

  it("lands on the section named in the hash", () => {
    window.location.hash = "#accounts";
    render(<SettingsPage />);
    expect(screen.getByRole("tab", { name: "Accounts & pockets" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    window.history.replaceState(null, "", window.location.pathname);
  });

  it("hosts payment methods as a section", () => {
    window.location.hash = "#methods";
    render(<SettingsPage />);
    expect(screen.getByRole("tab", { name: "Payment methods" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.getByTestId("methods-settings")).toBeInTheDocument();
    window.history.replaceState(null, "", window.location.pathname);
  });

  it("renders account details", () => {
    render(<SettingsPage />);
    // The sidebar footer shows the same identity, so scope to the page's own
    // Account card rather than matching across the whole layout.
    const main = screen.getByRole("main");
    expect(within(main).getByText("Ada Lovelace")).toBeInTheDocument();
    expect(within(main).getByText("ada@example.com")).toBeInTheDocument();
  });

  it("resets onboardingCompleted and navigates to the wizard on redo", async () => {
    updateMock.mockResolvedValue(undefined);
    render(<SettingsPage />);

    fireEvent.click(screen.getByRole("button", { name: "Redo onboarding" }));

    await waitFor(() => {
      expect(updateMock).toHaveBeenCalledWith({ onboardingCompleted: false });
      expect(pushMock).toHaveBeenCalledWith("/onboarding/categories");
    });
  });

  it("backfills missing default categories before reopening the wizard", async () => {
    updateMock.mockResolvedValue(undefined);
    render(<SettingsPage />);

    fireEvent.click(screen.getByRole("button", { name: "Redo onboarding" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/api/categories/defaults", { method: "POST" })
    );
  });

  it("does not navigate when the backfill fails", async () => {
    fetchMock.mockResolvedValue({ ok: false, text: async () => "boom" });
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    render(<SettingsPage />);

    fireEvent.click(screen.getByRole("button", { name: "Redo onboarding" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(updateMock).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("does not navigate when the update fails", async () => {
    updateMock.mockRejectedValue(new Error("network error"));
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    render(<SettingsPage />);

    fireEvent.click(screen.getByRole("button", { name: "Redo onboarding" }));

    await waitFor(() => expect(updateMock).toHaveBeenCalled());
    expect(pushMock).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
