import { render, screen } from "@testing-library/react";
import { NetworkMark, networkBrand } from "./NetworkMark";

describe("networkBrand", () => {
  it.each([
    ["Mastercard", "mastercard"],
    [" master card ", "mastercard"],
    ["VISA", "visa"],
    ["visa", "visa"],
    ["Amex", "amex"],
    ["American  Express", "amex"],
  ])("recognises %p as %s", (network, brand) => {
    expect(networkBrand(network)).toBe(brand);
  });

  it("draws nothing it doesn't know", () => {
    expect(networkBrand("Diners Club")).toBeNull();
    expect(networkBrand("Visa Electron")).toBeNull();
  });
});

describe("NetworkMark", () => {
  it("draws Mastercard's circles", () => {
    const { container } = render(<NetworkMark network="Mastercard" size="md" />);
    expect(container.querySelector("[data-brand='mastercard'] svg")).toBeInTheDocument();
  });

  it("writes the VISA wordmark and the Amex box", () => {
    render(
      <>
        <NetworkMark network="visa" size="sm" />
        <NetworkMark network="American Express" size="sm" />
      </>
    );
    expect(screen.getByText("VISA")).toBeInTheDocument();
    expect(screen.getByText("AMEX")).toBeInTheDocument();
  });

  it("keeps any other network's name as typed", () => {
    render(<NetworkMark network="Diners Club" size="md" />);
    expect(screen.getByText("Diners Club")).toBeInTheDocument();
  });
});
