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
