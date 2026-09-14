import { render, screen } from "@testing-library/react";
import { Amount } from "./Amount";
import { PrivacyProvider, PRIVACY_STORAGE_KEY } from "../../hooks/usePrivacy";

describe("Amount", () => {
  it("renders the formatted value", () => {
    render(<Amount value={1150} currency="USD" />);
    expect(screen.getByText(/\$1,150\.00/)).toBeInTheDocument();
  });

  it("marks converted aggregates as approximate", () => {
    render(<Amount value={100} currency="USD" approximate />);
    expect(screen.getByText("≈")).toBeInTheDocument();
  });

  it("appends the ISO code when asked", () => {
    render(<Amount value={100} currency="COP" showCode />);
    expect(screen.getByText("COP")).toBeInTheDocument();
  });
});

describe("Amount in privacy mode", () => {
  afterEach(() => localStorage.clear());

  it("masks the number", async () => {
    localStorage.setItem(PRIVACY_STORAGE_KEY, "true");
    render(
      <PrivacyProvider>
        <Amount value={1150} currency="USD" />
      </PrivacyProvider>
    );
    expect(await screen.findByText(/\$\*\*\*\*/)).toBeInTheDocument();
    expect(screen.queryByText(/1,150/)).not.toBeInTheDocument();
  });

  it("writes the value out while privacy mode is off", () => {
    render(
      <PrivacyProvider>
        <Amount value={1150} currency="USD" />
      </PrivacyProvider>
    );
    expect(screen.getByText(/\$1,150\.00/)).toBeInTheDocument();
  });
});
