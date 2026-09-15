import { render, screen } from "@testing-library/react";
import { OverlayLayerProvider, useOverlayLayer } from "./useOverlayLayer";

function Probe() {
  const { depth, menuZIndex, overlayZIndex } = useOverlayLayer();
  return <span data-testid="probe">{`${depth}/${menuZIndex}/${overlayZIndex}`}</span>;
}

const read = () => screen.getByTestId("probe").textContent;

describe("useOverlayLayer", () => {
  it("reports the page layer when there is no provider", () => {
    render(<Probe />);
    expect(read()).toBe("0/150/200");
  });

  it("puts a modal's own dropdowns above its scrim but below the next one", () => {
    render(
      <OverlayLayerProvider>
        <Probe />
      </OverlayLayerProvider>
    );
    // 250 clears the page-level scrim at 200, and stays under a nested one at 300.
    expect(read()).toBe("1/250/300");
  });

  it("keeps stepping for a modal opened from a modal", () => {
    render(
      <OverlayLayerProvider>
        <OverlayLayerProvider>
          <Probe />
        </OverlayLayerProvider>
      </OverlayLayerProvider>
    );
    expect(read()).toBe("2/350/400");
  });
});
